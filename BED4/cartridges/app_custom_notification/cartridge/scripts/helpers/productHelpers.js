"use strict";
var base = module.superModule;

function showProductPage(querystring, reqPageMetaData) {
    var URLUtils = require("dw/web/URLUtils");
    var ProductFactory = require("*/cartridge/scripts/factories/product");
    var pageMetaHelper = require("*/cartridge/scripts/helpers/pageMetaHelper");

    var params = querystring;
    var product = ProductFactory.get(params);
    var addToCartUrl = URLUtils.url("Cart-AddProduct");
    var canonicalUrl = URLUtils.url("Product-Show", "pid", product.id);
    var notifyUrl = URLUtils.url("Notify-Show", "pid", product.id);
    var breadcrumbs = base.getAllBreadcrumbs(null, product.id, []).reverse();

    var template = "product/productDetails";

    if (product.productType === "bundle" && !product.template) {
        template = "product/bundleDetails";
    } else if (product.productType === "set" && !product.template) {
        template = "product/setDetails";
    } else if (product.template) {
        template = product.template;
    }

    pageMetaHelper.setPageMetaData(reqPageMetaData, product);
    pageMetaHelper.setPageMetaTags(reqPageMetaData, product);
    var schemaData =
        require("*/cartridge/scripts/helpers/structuredDataHelper").getProductSchema(
            product
        );

    return {
        template: template,
        product: product,
        addToCartUrl: addToCartUrl,
        resources: base.getResources(),
        notifyUrl: notifyUrl,
        breadcrumbs: breadcrumbs,
        canonicalUrl: canonicalUrl,
        schemaData: schemaData,
    };
}
base.showProductPage = showProductPage;
module.exports = base;
