module.exports = function (actionService) {
    return {
        actionList: function (req, res) {
            res.json(actionService.actionListFor(req.body.entityCrudId, req.body.actionTarget));
        },
        performAction: function (req, res) {
            actionService.performAction(req.body.entityCrudId, req.body.actionId, req.body.selectedItemIds).then(function (actionResult) {
                res.json(actionResult);
            }).done();
        }
    };
};