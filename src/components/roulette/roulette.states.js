(function(ng){
  'use strict';

  ng.module('iqnixous')
    .config(function ($stateProvider) {
      $stateProvider
        .state('roulette', {
          url: '/roulette',
          templateUrl: 'components/roulette/roulette.html',
          controller: 'rouletteCtrl',
          data:{
            title: 'Roulette',
            description: 'This is all about testing that brain'
          }
        });

    });

})(angular);
