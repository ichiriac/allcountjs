var _ = require('underscore');
var Q = require('q');

module.exports = function (crudService, referenceService, entityDescriptionService, storageDriver) {
    var route = {};

    route.checkReadPermissionMiddleware = function (req, res, next) {
        if (req.body.entityCrudId && !entityDescriptionService.userHasReadAccess(req.body.entityCrudId, req.user)) {
            res.send(403, 'Permission denied');
        } else {
            next();
        }
    };

    route.checkWritePermissionMiddleware = function (req, res, next) {
        if (req.body.entityCrudId && !entityDescriptionService.userHasWriteAccess(req.body.entityCrudId, req.user)) {
            res.send(403, 'Permission denied');
        } else {
            next();
        }
    };

    route.findCount = function (req, res) {
        var strategyForCrudId = crudService.strategyForCrudId(req.body.entityCrudId);
        Q.all([
                strategyForCrudId.findCount(req.body.filtering),
                strategyForCrudId.getTotalRow(req.body.filtering)
            ]).spread(function (count, totalRow) {
            res.json({
                count: count,
                totalRow: totalRow || undefined
            });
        }).done();
    };

    route.findRange = function (req, res) {
        crudService
            .strategyForCrudId(req.body.entityCrudId)
            .findRange(req.body.filtering, req.body.start, req.body.count)
            .then(function (result) {
                res.json(result);
            })
            .done();
    };

    route.createEntity = function (req, res) {
        crudService
            .strategyForCrudId(req.body.entityCrudId)
            .createEntity(req.body.entity)
            .then(function (result) {
                res.send(result.toString());
            })
            .done();
    };

    route.readEntity = function (req, res) {
        crudService
            .strategyForCrudId(req.body.entityCrudId)
            .readEntity(req.body.entityId)
            .then(function (result) {
                res.json(result);
            })
            .done();
    };

    route.updateEntity = function (req, res) {
        crudService
            .strategyForCrudId(req.body.entityCrudId)
            .updateEntity(req.body.entity)
            .then(function (result) {
                res.json(result);
            })
            .done();
    };

    route.deleteEntity = function (req, res) {
        crudService
            .strategyForCrudId(req.body.entityCrudId)
            .deleteEntity(req.body.entityId)
            .then(function (result) {
                res.json(result);
            })
            .done();
    };

    route.referenceValues = function (req, res) { //TODO support reference TOP values
        referenceService.referenceValues({entityTypeId: req.params.entityTypeId}, req.params.queryText).then(function (result) {
            res.json(result);
        });
    };

    route.referenceValueByEntityId = function (req, res) {
        referenceService.referenceValueByEntityId(entityDescriptionService.entityTypeIdCrudId(req.params.entityTypeId), req.params.entityId).then(function (result) {
            res.json(result);
        });
    };

    route.uploadFile = function (req, res) {
        req.pipe(req.busboy);
        req.busboy.on('file', function (fieldname, file, filename) {
            storageDriver.createFile(filename, file).then(function (fileId) {
                res.json({files: [{fileId: fileId, name: filename}]});
            }).done();
        });
    };

    var mimeTypes = {
        pdf: 'application/pdf'
    };

    route.downloadFile = function (req, res) {
        storageDriver.getFile(req.params.fileId).then(function (file) {
            var split = file.fileName.split('.');
            var extension = '';
            if (split.length > 1) {
                extension = split[split.length - 1];
            }
            res.set('Content-Type', mimeTypes[extension] || 'application/octet-stream');
            if (!mimeTypes[extension]) {
                res.set('Content-Disposition',  'attachment; filename="' + file.fileName + '"');
            }
            file.stream.pipe(res);
        }).done();
    };

    return route;
};