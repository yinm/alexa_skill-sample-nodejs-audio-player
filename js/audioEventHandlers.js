'use strict';

const Alexa = require('alexa-sdk');
const audioData = require('./audioAssets');
const constants = require('./constants');

const audioEventHandlers = Alexa.CreateStateHandler(constants.states.PLAY_MODE, {
  'PlaybackStarted': function() {
    this.attributes['token'] = getToken.call(this);
    this.attributes['index'] = getIndex.call(this);
    this.attributes['playbackFinished'] = false;
    this.emit(':saveState', true);
  },
  'PlaybackFinished': function() {
    this.attributes['playbackFinished'] = true;
    this.attributes['enqueuedToken'] = false;
    this.emit(':saveState', true);
  },
  'PlaybackStopped': function() {
    this.attributes['token'] = getToken.call(this);
    this.attributes['index'] = getIndex.call(this);
    this.attributes['offsetInMilliseconds'] = getOffsetInMilliseconds.call(this);
    this.emit(':saveState', true);
  },
  'PlaybackNearlyFinished': function() {
    if (this.attributes['enqueuedToken']) {
      return this.context.succeed(true);
    }

    let enqueueIndex = this.attributes['index'];
    enqueueIndex += 1;
    // Checking if there are any items to be enqueued.
    if (enqueueIndex === audioData.length) {
      if (this.attributes['loop']) {
        // Enqueueing the first item since looping is enabled.
        enqueueIndex = 0;
      } else {
        // Nothing to enqueue since reached end of the list and looping is disabled.
        return this.context.succeed(true);
      }
    }

    // Setting attributes to indicate item is enqueued.
    this.attributes['enqueuedToken'] = String(this.attributes['playOrder'][enqueueIndex]);

    const enqueueToken = this.attributes['enqueuedToken'];
    const playBehavior = 'ENQUEUE';
    const podcast = audioData[this.attributes['playOrder'][enqueueIndex]];
    const expectedPreviousToken = this.attributes['token'];
    const offsetInMilliseconds = 0;

    this.response.audioPlayerPlay(playBehavior, podcast.url, enqueueToken, expectedPreviousToken, offsetInMilliseconds);
    this.emit(':responseReady');
  },
  'PlaybackFailed': function() {
    // AudioPlayer.PlaybackNearlyFinished Directive received. Logging the error.
    console.log("Playback Failed : %j", this.event.request.error);
    this.context.succeed(true);
  }
});

module.exports = audioEventHandlers;

function getToken() {
  // Extracting token received in the request.
  return this.event.request.token;
}

function getIndex() {
  const tokenValue = parseInt(this.event.request.token);
  return this.attributes['playOrder'].indexOf(tokenValue);
}

function getOffsetInMilliseconds() {
  return this.event.request.offsetInMilliseconds;
}
