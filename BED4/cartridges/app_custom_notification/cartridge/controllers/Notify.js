"use strict";

var server = require("server");
var URLUtils = require("dw/web/URLUtils");
var csrfProtection = require("*/cartridge/scripts/middleware/csrf");

server.get(
    "Show",
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var Resource = require("dw/web/Resource");
        var ProductFactory = require("*/cartridge/scripts/factories/product");
        var renderTemplateHelper = require("*/cartridge/scripts/renderTemplateHelper");
        var notifyForm = server.forms.getForm("notification");
        notifyForm.clear();

        var template = "notify/notify.isml";
        var params = req.querystring;
        var product = ProductFactory.get(params);
        var actionUrl = dw.web.URLUtils.url("Notify-Handler", "id", params.id);
        var context = {
            product: product,
            template: template,
            notifyForm: notifyForm,
            notificationTitleMsg: Resource.msg(
                "notification.title",
                "notification",
                null
            ),
            actionUrl: actionUrl,
        };

        res.setViewData(context);

        this.on("route:BeforeComplete", function (req, res) {
            var viewData = res.getViewData();
            var renderedTemplate = renderTemplateHelper.getRenderedHtml(
                viewData,
                viewData.template
            );

            res.json({
                renderedTemplate: renderedTemplate,
            });
        });

        next();
    }
);

server.post(
    "Handler",
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var notifyForm = server.forms.getForm("notification");
        var Resource = require("dw/web/Resource");

        if (!notifyForm.email.value) {
            notifyForm.valid = false;
        }

        if (notifyForm.valid) {
            this.on("route:BeforeComplete", function (req, res) {
                var Transaction = require("dw/system/Transaction");

                try {
                    Transaction.wrap(function () {
                        var CustomObjectMgr = require("dw/object/CustomObjectMgr");
                        var params = req.querystring;
                        var co = CustomObjectMgr.createCustomObject(
                            "NotificationLetter",
                            notifyForm.email.value
                        );
                        co.custom.firstName = notifyForm.fname.value;
                        co.custom.productId = params.id;

                        var context = {
                            notificationSuccessTitle: Resource.msg(
                                "notification.success.title",
                                "notification",
                                null
                            ),
                            notificationSuccessMsg: Resource.msgf(
                                "notification.success.msg",
                                "notification",
                                null,
                                notifyForm.email.value
                            ),
                            closeButtonText: Resource.msg(
                                "notification.successbutton.close",
                                "notification",
                                null
                            ),
                        };
                        res.setViewData(context);
                        res.json(context);
                    });
                } catch (error) {
                    res.setStatusCode(500);
                    res.json({
                        redirectUrl: URLUtils.url("Error-Start").toString(),
                    });
                }
            });
        } else {
            res.setStatusCode(500);
            res.json({
                redirectUrl: URLUtils.url("Error-Start").toString(),
            });
        }
        next();
    }
);

module.exports = server.exports();
