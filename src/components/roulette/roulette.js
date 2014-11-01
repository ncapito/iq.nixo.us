(function(ng) {
  'use strict';

  var app = ng.module('roulette');

  app.controller('rouletteCtrl', RouletteCtrl);

  /* @ngInject */
  function RouletteCtrl($scope, $timeout) {
    var game;

    $scope.answer = {

    };

    var data = {
      word: '_n_o_p_e_e_s_b_e'
    };

    $scope.game = game = new Game(data);



    var solution = 'incomprehensible';

    $scope.submit = function() {
      if (game.display().toLowerCase() === solution.toLowerCase()) {
        $scope.msg = 'success';
      } else {
        $scope.msg = 'meh';
      }

    };

    $timeout(function() {
      wheel.init();
      wheel.segments = game.letters;
      wheel.update();
      $scope.$watch('game.display()', function() {
        wheel.update();
      });
    }, 1000);

    function Game(data) {
      var word;

      data = data || {};
      word = data.word;

      this.letters = toArray(word);

      this.display = function() {
        var temp = [];
        angular.forEach(this.letters, function(item) {
          temp.push(item.letter || '_');
        });

        return temp.join('');
      };

      this.valid = function() {
        return !_.any(this.letters, function(item) {
          return item.letter === undefined || item.letter === '';
        });
      };

      /**
        //Convert string to array.  Replace underscores with null
      **/
      function toArray(word) {
        var temp = [];

        angular.forEach(word, function(item) {
          var letter = item;

          if (item === '_') {
            letter = undefined;
          }

          temp.push({
            letter: letter,
            hashCode: function() {
              // See http://www.cse.yorku.ca/~oz/hash.html
              var char, i, hash = 5381;
              var letter = this.letter || '';
              for (i = 0; i < letter.length; i++) {
                char = letter.charCodeAt(i);
                hash = ((hash << 5) + hash) + char;
                hash = hash & hash; // Convert to 32bit integer
              }
              return hash;
            }
          });

        });

        return temp;
      }

    }


    Number.prototype.mod = function(n) {
      return ((this % n) + n) % n;
    };


    // WHEEL!
    var wheel = {

      timerHandle: 0,
      timerDelay: 33,
      angleCurrent: 0,
      angleDelta: 0,
      size: 290,
      canvasContext: null,
      colors: ['#ffff00', '#ffc700', '#ff9100', '#ff6301', '#ff0000', '#c6037e',
        '#713697', '#444ea1', '#2772b2', '#0297ba', '#008e5b', '#8ac819'
      ],
      segments: [],
      segColors: [], // Cache of segments to colors
      maxSpeed: Math.PI / 16,
      upTime: 1000, // How long to spin up for (in ms)
      downTime: 17000, // How long to slow down for (in ms)
      spinStart: 0,
      frames: 0,
      centerX: 300,
      centerY: 300,

      init: function(optionList) {
        try {
          wheel.initAudio();
          wheel.initCanvas();
          wheel.draw();

          $.extend(wheel, optionList);

        } catch (exceptionData) {
          alert('Wheel is not loaded ' + exceptionData);
        }

      },

      initAudio: function() {
        var sound = document.createElement('audio');
        sound.setAttribute('src', 'http://bramp.net/javascript/wheel.mp3');
        wheel.sound = sound;
      },

      initCanvas: function() {
        var canvas = $('#canvas').get(0);
        canvas.addEventListener('click', wheel.spin, false);
        wheel.canvasContext = canvas.getContext('2d');
      },

      // Called when segments have changed
      update: function() {
        // Ensure we start mid way on a item
        //var r = Math.floor(Math.random() * wheel.segments.length);
        var r = 0;
        wheel.angleCurrent = ((r + 0.5) / wheel.segments.length) * Math.PI * 2;

        var segments = wheel.segments;
        var len = segments.length;
        var colors = wheel.colors;
        var colorLen = colors.length;

        // Generate a color cache (so we have consistant coloring)
        var segColor = [];
        for (var i = 0; i < len; i++){
          segColor.push(colors[segments[i].hashCode().mod(colorLen)]);
        }

        wheel.segColor = segColor;

        wheel.draw();
      },

      draw: function() {
        wheel.clear();
        wheel.drawWheel();
      },

      clear: function() {
        var ctx = wheel.canvasContext;
        ctx.clearRect(0, 0, 1000, 800);
      },

      drawSegment: function(key, lastAngle, angle) {
        var ctx = wheel.canvasContext;
        var centerX = wheel.centerX;
        var centerY = wheel.centerY;
        var size = wheel.size;

        var segments = wheel.segments;
        var colors = wheel.segColor;

        var value = segments[key].letter || '';

        ctx.save();
        ctx.beginPath();

        // Start in the centre
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, size, lastAngle, angle, false); // Draw a arc around the edge
        ctx.lineTo(centerX, centerY); // Now draw a line back to the centre
        // Clip anything that follows to this area
        //ctx.clip(); // It would be best to clip, but we can double performance without it
        ctx.closePath();

        ctx.fillStyle = colors[key];
        ctx.fill();
        ctx.stroke();

        // Now draw the text
        ctx.save(); // The save ensures this works on Android devices
        ctx.translate(centerX, centerY);
        ctx.rotate((lastAngle + angle) / 2);

        ctx.fillStyle = '#000000';
        ctx.fillText(value.substr(0, 20), size / 2 + 100, 0);
        ctx.restore();

      },

      drawWheel: function() {
        var ctx = wheel.canvasContext;

        var angleCurrent = wheel.angleCurrent;
        var lastAngle = angleCurrent;

        var len = wheel.segments.length;

        var centerX = wheel.centerX;
        var centerY = wheel.centerY;
        var size = wheel.size;

        var PI2 = Math.PI * 2;

        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000000';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.font = '1.4em Arial';

        for (var i = 1; i <= len; i++) {
          var angle = PI2 * (i / len) + angleCurrent;
          wheel.drawSegment(i - 1, lastAngle, angle);
          lastAngle = angle;
        }
        // Draw a center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 200, 0, PI2, false);
        ctx.closePath();

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.fill();
        ctx.stroke();

        // Draw outer circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, size, 0, PI2, false);
        ctx.closePath();

        ctx.lineWidth = 10;
        ctx.strokeStyle = '#000000';
        ctx.stroke();
      },
    };


  }



})(angular);
