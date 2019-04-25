(function(window){
  window.extractData = function() {
    var ret = $.Deferred();

    function onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }

    function onReady(smart)  {
      if (smart.hasOwnProperty('patient')) {
        var patient = smart.patient;
        var pt = patient.read();
        var obv = smart.patient.api.fetchAll({
                    type: 'Observation',
                    query: {
                      code: {
                        $or: ['http://loinc.org|61133-5', 'http://loinc.org|62365-2',
                              'http://loinc.org|64295-9', 'http://loinc.org|11500-6',
                              'http://loinc.org|11492-6', 'http://loinc.org|11505-5']
                      }
                    }
                  });

        $.when(pt, obv).fail(onError);

        $.when(pt, obv).done(function(patient, obv) {
          var byCodes = smart.byCodes(obv, 'code');
          var gender = patient.gender;

          var fname = '';
          var lname = '';

          if (typeof patient.name[0] !== 'undefined') {
            fname = patient.name[0].given.join(' ');
            lname = patient.name[0].family.join(' ');
          }

          /*var height = byCodes('8302-2');
          var systolicbp = getBloodPressureValue(byCodes('55284-4'),'8480-6');
          var diastolicbp = getBloodPressureValue(byCodes('55284-4'),'8462-4');
          var hdl = byCodes('2085-9');
          var ldl = byCodes('2089-1');*/

          var p = defaultPatient();
          p.birthdate = patient.birthDate;
          p.gender = gender;
          p.fname = fname;
          p.lname = lname;
          //p.height = getQuantityValueAndUnit(height[0]);

          /*if (typeof systolicbp != 'undefined')  {
            p.systolicbp = systolicbp;
          }

          if (typeof diastolicbp != 'undefined') {
            p.diastolicbp = diastolicbp;
          }

          p.hdl = getQuantityValueAndUnit(hdl[0]);
          p.ldl = getQuantityValueAndUnit(ldl[0]);*/
          
          p.note1 = getObservationMembers(byCodes('61133-5'));
          p.note2 = getObservationMembers(byCodes('62365-2'));
          p.note3 = getObservationMembers(byCodes('64295-9'));
          p.note4 = getObservationMembers(byCodes('11500-6'));
          p.note5 = getObservationMembers(byCodes('11492-6'));
          p.note6 = getObservationMembers(byCodes('11505-5'));

          ret.resolve(p);
        });
      } else {
        onError();
      }
    }

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();

  };

  function defaultPatient(){
    return {
      fname: {value: ''},
      lname: {value: ''},
      gender: {value: ''},
      birthdate: {value: ''},
      height: {value: ''},
      systolicbp: {value: ''},
      diastolicbp: {value: ''},
      ldl: {value: ''},
      hdl: {value: ''},
      note1: {value: ''},
      note2: {value: ''},
      note3: {value: ''},
      note4: {value: ''},
      note5: {value: ''},
      note6: {value: ''}
    };
  }

  function getBloodPressureValue(BPObservations, typeOfPressure) {
    var formattedBPObservations = [];
    BPObservations.forEach(function(observation){
      var BP = observation.component.find(function(component){
        return component.code.coding.find(function(coding) {
          return coding.code == typeOfPressure;
        });
      });
      if (BP) {
        observation.valueQuantity = BP.valueQuantity;
        formattedBPObservations.push(observation);
      }
    });

    return getQuantityValueAndUnit(formattedBPObservations[0]);
  }

  function getQuantityValueAndUnit(ob) {
    if (typeof ob != 'undefined' &&
        typeof ob.valueQuantity != 'undefined' &&
        typeof ob.valueQuantity.value != 'undefined' &&
        typeof ob.valueQuantity.unit != 'undefined') {
          return ob.valueQuantity.value + ' ' + ob.valueQuantity.unit;
    } else {
      return undefined;
    }
  }
  
  function getObservationString(ob) {
    if (typeof ob != 'undefined' &&
        typeof ob.valueCodeableConcept != 'undefined' &&
        typeof ob.valueCodeableConcept.text != 'undefined') {
          return ob.valueCodeableConcept.text;
    } else {
      return undefined;
    }
  }
  
  function getObservationMembers(ob) {
    var allMembers = ob.length+": ";
    for (property in ob) {
      allMembers += property+', ';
    }
  }

  window.drawVisualization = function(p) {
    $('#holder').show();
    $('#loading').hide();
    $('#fname').html(p.fname);
    $('#lname').html(p.lname);
    $('#gender').html(p.gender);
    $('#birthdate').html(p.birthdate);
    /*$('#height').html(p.height);
    $('#systolicbp').html(p.systolicbp);
    $('#diastolicbp').html(p.diastolicbp);
    $('#ldl').html(p.ldl);
    $('#hdl').html(p.hdl);*/
    $('#note1').html(p.note1);
    $('#note2').html(p.note2);
    $('#note3').html(p.note3);
    $('#note4').html(p.note4);
    $('#note5').html(p.note5);
    $('#note6').html(p.note6);
  };

})(window);
