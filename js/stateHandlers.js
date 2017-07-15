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
  resumeDecisionModeIntentHandlers: Alexa.CreateStateHandler(constants.states.RESUME_DECISION_MODE, {
    'LaunchRequest': function() {
      const message = 'You were listening to ' + audioData[this.attributes['playOrder'][this.attributes['index']]].title +
          ' Would you like to resume?';
      const reprompt = 'You can say yes to resume or no to play from the top.';
      this.emit(':responseReady');
    },
    'AMAZON.YesIntent': function() { controller.play.call(this) },
    'AMAZON.NoIntent': function() { controller.reset.call(this) },
    'AMAZON.HelpIntent': function() {
      const message = 'You were listening to ' + audioData[this.attributes['index']].title +
          ' Would you like to resume?';
      const reprompt = 'You can say yes to resume or no to play from the top.';
      this.response.speak(message).listen(reprompt);
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
    'SessionEndedReqest': function() {
      // No session ended logic
    },
    'Unhandled': function() {
      const message = 'Sorry, this is not a valid command. Please say help to hear what you can say.';
      this.response.speak(message).listen(message);
      this.emit(':responseReady');
    }
  })
};

module.exports = stateHandlers;

const controller = function() {
  return {
    play: function() {
      this.handler.state = constants.states.PLAY_MODE;

      if (this.attributes['playbackFinished']) {
        // Reset to top of the playlist when reached end.
        this.attributes['index'] = 0;
        this.attributes['offsetInMilliseconds'] = 0;
        this.attributes['playbackIndexChanged'] = true;
        this.attributes['playbackFinished'] = false;
      }

      const token = String(this.attributes['playOrder'][this.attributes['index']]);
      const playBehavior = 'REPLACE_ALL';
      const podcast = audioData[this.attributes['playOrder'][this.attributes['index']]];
      const offsetInMilliseconds = this.attributes['offsetInMilliseconds'];

      // Since play behavior is REPLACE_ALL, enqueuedToken attribute need to be set to null.
      this.attributes['enqueuedToken'] = null;

      if (canThrowCard.call(this)) {
        const cardTitle = 'Playing ' + podcast.title;
        const cardContent = 'Playing ' + podcast.title;
        this.response.cardRenderer(cardTitle, cardContent, null);
      }

      this.response.audioPlayerPlay(playBehavior, podcast.url, token, null, offsetInMilliseconds);
      this.emit(':responseReady');
    },
    stop: function() {
      this.response.audioPlayerStop();
      this.emit(':responseReady');
    },
    playNext: function() {
      let index = this.attributes['index'];
      index += 1;

      // Check for last audio file.
      if (index === audioData.length) {
        if (this.attributes['loop']) {
          index = 0;
        } else {
          // Reached at the end. Thus reset state to start mode and stop playing.
          this.handler.state = constants.states.START_MODE;

          const message = 'You have reached at the end or the playlist.';
          this.response.speak(mesasge).audioPlayerStop();
          return this.emit(':responseReady');
        }
      }

      // Set values to attributes.
      this.attributes['index'] = index;
      this.attributes['offsetInMilliseconds'] = 0;
      this.attributes['playbackIndexChanged'] = true;

      controller.play.call(this);
    },
    playPrevious: function() {
      let index = this.attributes['index'];
      index -= 1;

      // Check for last audio file.
      if (index === -1) {
        if (this.attributes['loop']) {
          index = audioData.length - 1;
        } else {
          // Reached at the end. Thus reset state to start mode and stop playing.
          this.handler.state = constants.states.START_MODE;

          const message = 'You have reached at the start of the playlist.';
          this.response.speak(message).audioPlayerStop();
          return this.emit(':responseReady');
        }
      }

      // Set values to attributes
      this.attributes['index'] = index;
      this.attributes['offsetInMilliseconds'] = 0;
      this.attributes['playbackIndexChanged'] = true;

      controller.play.call(this);
    },
    loopOn: function() {
      // Turn on loop play.
      this.attributes['loop'] = true;
      const message = 'Loop turned on.';
      this.response.speak(message);
      this.emit(':responseReady');
    },
    loopOff: function() {
      // Turn off looping
      this.attributes['loop'] = false;
      const message = 'Loop turned off.';
      this.response.speak(message);
      this.emit(':responseReady');
    },
    shuffleOn: function() {
      // Turn on shuffle play.
      this.attributes['shuffle'] = true;
      shuffleOrder((newOrder) => {
        // Play order have been shuffled. Re-initializing indices and playing first song in shuffled order.
        this.attributes['playOrder'] = newOrder;
        this.attributes['index'] = 0;
        this.attributes['offsetInMilliseconds'] = 0;
        this.attributes['playbackIndexChanged'] = true;
        controller.play.call(this);
      });
    },
    shuffleOff: function() {
      // Turn off shuffle play.
      if (this.attributes['shuffle']) {
        this.attributes['shuffle'] = false;

        // Although changing index, no change in audio file being played as the change is to account for reordering playOrder
        this.attributes['index'] = this.attributes['playOrder'][this.attributes['index']];
        this.attributes['playOrder'] = Array.apply(null, {length: audioData.length}).map(Number.call, Number);
      }

      controller.play.call(this);
    },
    startOver: function() {
      // Start over the current audio file.
      this.attributes['offsetInMilliseconds'] = 0;
      controller.play.call(this);
    },
    reset: function() {
      // Reset to top of the playlist.
      this.attributes['index'] = 0;
      this.attributes['offsetInMilliseconds'] = 0;
      this.attributes['playbackIndexChanged'] = true;
      controller.play.call(this);
    }
  }
}();

function canThrowCard() {
  if (
      this.event.request.type === 'IntentRequest'
   && this.attributes['playbackIndexChanged']
  ) {
    this.attributes['playbackIndexChanged'] = false;
    return true;
  } else {
    return false;
  }
}
