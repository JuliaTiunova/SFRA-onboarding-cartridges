"use strict";

var server = require("server");

var cache = require("*/cartridge/scripts/middleware/cache");
var consentTracking = require("*/cartridge/scripts/middleware/consentTracking");
var pageMetaData = require("*/cartridge/scripts/middleware/pageMetaData");

server.extend(module.superModule);

server.append(
    "Show",
    cache.applyPromotionSensitiveCache,
    consentTracking.consent,
    function (req, res, next) {
        var productHelper = require("*/cartridge/scripts/helpers/productHelpers");
        var showProductPageHelperResult = productHelper.showProductPage(
            req.querystring,
            req.pageMetaData
        );
        // get custom SitePreference to render template conditionally
        var SitePreferences = dw.system.Site.getCurrent().getPreferences();
        var renderNotifyMe = SitePreferences.getCustom()["renderNotifyMe"];
        var productType = showProductPageHelperResult.product.productType;
        var viewData = res.getViewData();
        viewData.renderNotifyMe = renderNotifyMe;

        var actionUrl = dw.web.URLUtils.url("Notify-Handler");

        if (
            !showProductPageHelperResult.product.online &&
            productType !== "set" &&
            productType !== "bundle"
        ) {
            res.setStatusCode(404);
            res.render("error/notFound");
        } else {
            var pageLookupResult = productHelper.getPageDesignerProductPage(
                showProductPageHelperResult.product
            );

            if (
                (pageLookupResult.page &&
                    pageLookupResult.page.hasVisibilityRules()) ||
                pageLookupResult.invisiblePage
            ) {
                // the result may be different for another user, do not cache on this level
                // the page itself is a remote include and can still be cached
                res.cachePeriod = 0; // eslint-disable-line no-param-reassign
            }
            if (pageLookupResult.page) {
                res.page(
                    pageLookupResult.page.ID,
                    {},
                    pageLookupResult.aspectAttributes
                );
            } else {
                res.render(showProductPageHelperResult.template, {
                    product: showProductPageHelperResult.product,
                    addToCartUrl: showProductPageHelperResult.addToCartUrl,
                    resources: showProductPageHelperResult.resources,
                    breadcrumbs: showProductPageHelperResult.breadcrumbs,
                    canonicalUrl: showProductPageHelperResult.canonicalUrl,
                    schemaData: showProductPageHelperResult.schemaData,
                    notifyUrl: showProductPageHelperResult.notifyUrl,
                    actionUrl: actionUrl,
                });
            }
        }
        next();
    },
    pageMetaData.computedPageMetaData
);

module.exports = server.exports();
