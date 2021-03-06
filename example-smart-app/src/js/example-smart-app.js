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
                        $or: ['http://loinc.org|8302-2', 'http://loinc.org|8462-4',
                              'http://loinc.org|8480-6', 'http://loinc.org|2085-9',
                              'http://loinc.org|2089-1', 'http://loinc.org|55284-4',
                              'http://loinc.org|61133-5', 'http://loinc.org|62365-2',
                              'http://loinc.org|64295-9', 'http://loinc.org|11500-6',
                              'http://loinc.org|11492-6', 'http://loinc.org|11505-5',
                              'http://loinc.org|18726-0', 'http://loinc.org|89806-4',
                              'http://loinc.org|72556-4', 'http://loinc.org|75238-6',
                              'http://loinc.org|75490-3', 'http://loinc.org|83582-7']
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

          var height = byCodes('8302-2');
          var systolicbp = getBloodPressureValue(byCodes('55284-4'),'8480-6');
          var diastolicbp = getBloodPressureValue(byCodes('55284-4'),'8462-4');
          var hdl = byCodes('2085-9');
          var ldl = byCodes('2089-1');
          
          var sys = initSystemInfo();
          sys.userid = smart.tokenResponse.user;
          sys.username = smart.tokenResponse.username;
          sys.domain = smart.state.provider.name;

          var p = defaultPatient();
          p.id = patient.id;
          p.birthdate = patient.birthDate;
          p.gender = gender;
          p.fname = fname;
          p.lname = lname;
          p.height = getQuantityValueAndUnit(height[0]);

          if (typeof systolicbp != 'undefined')  {
            p.systolicbp = systolicbp;
          }

          if (typeof diastolicbp != 'undefined') {
            p.diastolicbp = diastolicbp;
          }

          p.hdl = getQuantityValueAndUnit(hdl[0]);
          p.ldl = getQuantityValueAndUnit(ldl[0]);
          
          p.note1 = getObservationMembers(byCodes('61133-5'));
          p.note2 = getObservationMembers(byCodes('62365-2'));
          p.note3 = getObservationMembers(byCodes('64295-9'));
          p.note4 = getObservationMembers(byCodes('11500-6'));
          p.note5 = getObservationMembers(byCodes('11492-6'));
          p.note6 = getObservationMembers(byCodes('11505-5'));
          p.rad1 = getObservationMembers(byCodes('18726-0'));
          p.rad2 = getObservationMembers(byCodes('89806-4'));
          p.rad3 = getObservationMembers(byCodes('72556-4'));
          p.rad4 = getObservationMembers(byCodes('75238-6'));
          p.rad5 = getObservationMembers(byCodes('75490-3'));
          p.rad6 = getObservationMembers(byCodes('83582-7'));

          ret.resolve(p, sys);
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
      id: {value: ''},
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
      note6: {value: ''},
      rad1: {value: ''},
      rad2: {value: ''},
      rad3: {value: ''},
      rad4: {value: ''},
      rad5: {value: ''},
      rad6: {value: ''}
    };
  }
  
  function initSystemInfo() {
    return {
      userid: {value: ''},
      username: {value: ''},
      domain: {value: ''}
    };
  };

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
    /*if (typeof ob != 'undefined' &&
        typeof ob.valueCodeableConcept != 'undefined' &&
        typeof ob.valueCodeableConcept.text != 'undefined') {
          return ob.valueCodeableConcept.text;
    } else {
      return undefined;
    }*/
    return '-test-';
  }
  
  function getObservationMembers(ob) {
    //return typeof ob
    var numObservations = ob.length;
    //var allMembers = numObservations+": ";
    var allMembers = "";
    for (var i=0; i<numObservations; i++) {
      for (x in ob[i]) {
        allMembers += x+', ';
      }
    }
    return allMembers;
  }

  window.drawVisualization = function(p,sys) {
    $('#holder').show();
    $('#loading').hide();
    
    $('#userid').html(sys.userid);
    $('#username').html(sys.username);
    $('#domain').html(sys.domain);
    
    $('#patientid').html(p.id);
    $('#fname').html(p.fname);
    $('#lname').html(p.lname);
    $('#gender').html(p.gender);
    $('#birthdate').html(p.birthdate);
    $('#height').html(p.height);
    $('#systolicbp').html(p.systolicbp);
    $('#diastolicbp').html(p.diastolicbp);
    $('#ldl').html(p.ldl);
    $('#hdl').html(p.hdl);
    $('#notes').html(p.note1 + "; "+p.note2+ "; "+p.note3+ "; "+p.note4+ "; "+p.note5+ "; "+p.note6);
    $('#radiology').html(p.rad1 + "; "+p.rad2+ "; "+p.rad3+ "; "+p.rad4+ "; "+p.rad5+ "; "+p.rad6);
  };

})(window);
