import Ember from 'ember';
import IssuesRoute from 'dispatcher/mixins/issues-route';

export default Ember.Route.extend(IssuesRoute, {

  model: function(params) {
    // In the future, it would be worthwhile to consider keeping entities
    // and their edits across issues.
    this.store.unloadAll('changeset');
    this.store.unloadAll('change_payload');
    this.store.unloadAll('stop');
    this.store.unloadAll('route-stop-pattern');
    // leave issues, so as to not have to repopulate issues table

    var self = this;
    return this.store.findRecord('issue', params['issue_id'], { reload: true }).then(function(selectedIssue){

      let changeset = self.store.createRecord('changeset', {
        notes: 'Issue resolution:'
      });
      changeset.get('change_payloads').createRecord();
      let users = self.store.query('user', { per_page: false });
      var rsps = [];
      var stops = [];
      selectedIssue.get('entities_with_issues').forEach(function(entity){
        if (entity.get('onestop_id').split('-')[0] === 'r') {
          rsps.push(entity.get('onestop_id'));
        }
        else if (entity.get('onestop_id').split('-')[0] === 's') {
          stops.push(entity.get('onestop_id'));
        }
      });
      return self.store.query('stop', {onestop_id: stops.join(',')}).then(function(stops){

        var bounds = new L.latLngBounds(stops.map(function(stop) {
          return new L.latLng(stop.get('coordinates'));
        }));
        return self.store.query('route-stop-pattern', {onestop_id: rsps.join(',')}).then(function(rsps){

          rsps.forEach(function(rsp){
            rsp.get('coordinates').forEach(function(coord){
              bounds.extend(new L.latLng(coord));
            });
          });

          return Ember.RSVP.hash({
            selectedIssue: selectedIssue,
            issueRouteStopPatterns: rsps,
            issueStops: stops,
            bounds: bounds,
            changeset: changeset,
            users: users
          });
        });
      });
    });
  }
});
