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
};