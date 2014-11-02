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
        kineticjs.draw();
      });
      kineticjs.segments = game.letters;
      kineticjs.init();
      kineticjs.draw();
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

    var PI2 = Math.PI * 2;
    var color={
      colors: {},
      getRandomColor:function () {
        var letters = '0123456789ABCDEF'.split('');
        var color = '#';
        for (var i = 0; i < 6; i++ ) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
      },
      getColor: function(letter){
          //check if it exists
          var exists  = color.colors[letter];
          if(exists){
            return exists;
          }
          if(letter === ''){
            exists = color.colors[letter] = '#ffffff';
          }else{
            exists = color.colors[letter] = color.getRandomColor();
          }
          return exists;
      },
    }

    var kineticjs = {
      size: 290,

      segments: [],
      radius: 290,
      width: 600,
      height: 600,
      stage: null,
      init: function(){
        if(kineticjs.stage){
          return;
        }

        kineticjs.stage = new Kinetic.Stage({
          container: 'canvas2',
          width: kineticjs.width,
          height: kineticjs.height,
          display: 'block'
        });
      },

      draw: function(){
        kineticjs.stage.clear();
        var layer = new Kinetic.Layer();

        var center = new Kinetic.Circle({
            x: 300,
            y: 300,
            radius: 150,
            fill: 'white',
            stroke: 'black'
        });
        layer.add(center);

        var startingAngle = 0;
        var rotatingAngle = startingAngle;
        var angleOffset =  360/ kineticjs.segments.length;
        angular.forEach(kineticjs.segments, function(item){
            var value = item.letter || '';
            rotatingAngle += angleOffset;
            var wedge = new Kinetic.Wedge({
              x: kineticjs.stage.width() / 2,
              y: kineticjs.stage.height() / 2,
              radius: kineticjs.radius,
              angle: angleOffset,
              fill: color.getColor(value),
              stroke: 'black',
              strokeWidth: 4,
              rotation: rotatingAngle

            });
            layer.add(wedge);
            wedge.moveToBottom();


            var offset = {
                x: -(kineticjs.radius) + 75, //innercirl is 150,
                y: -30
            };
            var textAngle = rotatingAngle;


            if (rotatingAngle > 90 && rotatingAngle < 270) {
                var offset = {
                    x: kineticjs.radius - 75,
                    y: 50
                };
                var textAngle = rotatingAngle - 180;

            }

            var text = new Kinetic.Text({
                  x:300,
                  y:300,
                  text: value,
                  fontSize: 20,
                  fill: 'black',
                  rotationDeg:textAngle,
                  offset:offset
              });
            layer.add(text);


        });
        // add the layer to the stage
        kineticjs.stage.add(layer);
        layer.draw();

      }
    }




    // WHEEL!
    var wheel = {
      angleCurrent: 0,
      size: 290,
      canvasContext: null,

      segments: [],
      segColors: [], // Cache of segments to colors
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
        var value = wheel.segments[key].letter || '';

        ctx.save();
        ctx.beginPath();

        // Start in the centre
        ctx.moveTo(wheel.centerX, wheel.centerY);
        ctx.arc(wheel.centerX, wheel.centerY, wheel.size, lastAngle, angle, false); // Draw a arc around the edge
        ctx.lineTo(wheel.centerX, wheel.centerY); // Now draw a line back to the centre
        // Clip anything that follows to this area
        //ctx.clip(); // It would be best to clip, but we can double performance without it
        ctx.closePath();

        ctx.fillStyle = color.getColor(value);
        ctx.fill();
        ctx.stroke();

        // Now draw the text
        ctx.save(); // The save ensures this works on Android devices
        ctx.translate(wheel.centerX, wheel.centerY);
        ctx.rotate((lastAngle + angle) / 2);

        ctx.fillStyle = '#000000';
        ctx.fillText(value.substr(0, 20), wheel.size / 2 + 100, 0);
        ctx.restore();

      },

      drawWheel: function() {
        var ctx = wheel.canvasContext;
        var lastAngle = wheel.angleCurrent;

        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000000';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.font = '1.4em Arial';

        for (var i = 1; i <= wheel.segments.length; i++) {
          var angle = PI2 * (i / wheel.segments.length) + wheel.angleCurrent;
          wheel.drawSegment(i - 1, lastAngle, angle);
          lastAngle = angle;
        }
        // Draw a center circle
        ctx.beginPath();
        ctx.arc(wheel.centerX, wheel.centerY, 200, 0, PI2, false);
        ctx.closePath();

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.fill();
        ctx.stroke();

        // Draw outer circle
        ctx.beginPath();
        ctx.arc(wheel.centerX, wheel.centerY, wheel.size, 0, PI2, false);
        ctx.closePath();

        ctx.lineWidth = 10;
        ctx.strokeStyle = '#000000';
        ctx.stroke();
      },
    };


  }



})(angular);
