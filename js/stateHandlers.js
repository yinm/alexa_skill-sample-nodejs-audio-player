'use strict';

const Alexa = require('alexa-sdk');
const audioData = require('./audioAssets');
const constants = require('./constants');

const stateHandlers = {
  startModeIntentHandlers: Alexa.CreateStateHandler(constants.states.START_MODE, {
    'LaunchRequest': function() {
      // Initialize Attributes
      this.attributes['playOrder'] = Array.apply(null, {length: audioData.length}).map(Number.call, Number);
      this.attributes['index'] = 0;
      this.attributes['offsetInMilliseconds'] = 0;
      this.attributes['loop'] = true;
      this.attributes['shuffle'] = false;
      this.attributes['playbackIndexChanged'] = true;

      // Change state to START_MODE
      this.handler.state = constants.states.START_MODE;

      const message = 'Welcome to the AWS Podcast. You can say, play the audio to begin the podcast.';
      const reprompt = 'You can say, play the audio, to begin.';

      this.response.speak(message).listen(reprompt);
      this.emit(':responseReady');
    },
    'PlayAudio': function() {
      if (!this.attributes['playOrder']) {
        // Initialize Attributes if undefined.
        this.attributes['playOrder'] = Array.apply(null, {length: audioData.length}).map(Number.call, Number);
        this.attributes['index'] = 0;
        this.attributes['offsetInMilliseconds'] = 0;
        this.attributes['loop'] = true;
        this.attributes['shuffle'] = false;
        this.attributes['playbackIndexChanged'] = true;

        // Change state to START_MODE
        this.handler.state = constants.states.START_MODE;
      }

      controller.play.call(this);
    },
    'AMAZON.HelpIntent': function() {
      const message = 'Welcome to the AWS Podcast. You can say, play the audio, to begin the podcast.';
      this.response.speak(message).listen(message);
      this.emit(':responseReady');
    },
    'AMAZON.StopIntent': function() {
      const message = 'Good bye.';
      this.response.speak(message);
      this.emit(':responseReady');
    },
    'AMAZON.CancelIntent': function() {
      const message = 'Good bye.';
      this.response.speak(message);
      this.emit(':responseReady');
    },
    'SessionEndedRequest': function() {
      // No session ended logic
    },
    'Unhandled': function() {
      const message = 'Sorry, I could not understand. Please say, play the audio, to begin the audio.';
      this.response.speak(message).listen(message);
      this.emit(':responseReady');
    }
  }),
  playModeIntentHandlers: Alexa.CreateStateHandler(constants.states.PLAY_MODE, {
    'LaunchRequest': function() {
      let message;
      let reprompt;

      if (this.attributes['playbackFinished']) {
        this.handler.state = constants.states.START_MODE;
        message = 'Welcome to the AWS Podcast. You can say, play the audio to begin the podcast.';
        reprompt = 'You can say, play the audio, to begin.';
      } else {
        this.handler.state = constants.states.RESUME_DECISION_MODE;
        message = 'You were listening to ' + audioData[this.attributes['playOrder'][this.attributes['index']]].title +
            ' Would you like to resume?';
        reprompt = 'You can say yes to resume or no to play from the top.';
      }

      this.response.speak(message).listen(reprompt);
      this.emit(':responseReady');
    },
    'PlayAudio': function() { controller.play.call(this) },
    'AMAZON.NextIntent': function() { controller.playNext.call(this) },
    'AMAZON.PreviousIntent': function() { controller.playPrevious.call(this) },
    'AMAZON.PauseIntent': function() { controller.stop.call(this) },
    'AMAZON.StopIntent': function() { controller.stop.call(this) },
    'AMAZON.CancelIntent': function() { controller.stop.call(this) },
    'AMAZON.ResumeIntent': function() { controller.play.call(this) },
    'AMAZON.LoopOnIntent': function() { controller.loopOn.call(this) },
    'AMAZON.LoopOffIntent': function() { controller.loopOff.call(this) },
    'AMAZON.ShuffleOnIntent': function() { controller.shuffleOn.call(this) },
    'AMAZON.ShuffleOffIntent': function() { controller.shuffleOff.call(this) },
    'AMAZON.StartOverIntent': function() { controller.startOver.call(this) },
    'AMAZON.HelpIntent': function() {
      const message = 'You are listening to the AWS Podcast. You can say, Next or Previous to navigate through the playlist. ' +
          'At any time, you can say Pause to pause the audio and Resume to resume.';
      this.response.speak(message).listen(message);
      this.emit(':responseReady');
    },
    'SessionEndedRequest': function() {
      // No session ended logic
    },
    'Unhandled': function() {
      const message = 'Sorry, I could not understand. You can say, Next or Previous to navigate through the playlist.';
      this.response.speak(message).listen(message);
      this.emit(':responseReady');
    }
  }),
  remoteControllerHandlers: Alexa.CreateStateHandler(constants.states.PLAY_MODE, {
    'PlayCommandIssued': function() { controller.play.call(this) },
    'PauseCommandIssued': function() { controller.stop.call(this) },
    'NextCommandIssued': function() { controller.playNext.call(this) },
    'PreviousCommandIssued': function() { controller.playPrevious.call(this) }
  }),

};