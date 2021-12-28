"use strict";
var base = require("base/product/base");

function getModalHtmlElement() {
    if ($("#notificationModal").length !== 0) {
        $("#notificationModal").remove();
    }
    if ($(".modal-backdrop").length !== 0) {
        $(".modal-backdrop").remove();
    }
    var htmlString =
        "<!-- Modal -->" +
        '<div class="modal fade" id="notificationModal" role="dialog">' +
        '   <span class="enter-message sr-only" ></span>' +
        '   <div class="modal-dialog quick-view-dialog">' +
        "<!-- Modal content-->" +
        '       <div class="modal-content">' +
        '           <div class="modal-header">' +
        '               <p class="modal-header-text"></p>' +
        "           </div>" +
        '           <div class="modal-body"></div>' +
        '           <div class="modal-footer"></div>' +
        "       </div>" +
        "   </div>" +
        "</div>";
    $("body").append(htmlString);
}

function parseHtml(html) {
    var $html = $("<div>").append($.parseHTML(html));

    var body = $html.find(".product-notification");
    var footer = $html.find(".modal-footer").children();

    return { body: body, footer: footer };
}

function fillModalElement(selectedValueUrl) {
    $(".modal-body").spinner().start();
    var variantId = $(".product-id").html();
    $.ajax({
        url: selectedValueUrl,
        method: "GET",
        dataType: "json",
        data: { id: variantId },
        success: function (data) {
            var parsedHtml = parseHtml(data.renderedTemplate);

            $(".modal-body").empty();
            $(".modal-body").html(parsedHtml.body);
            $(".modal-header-text").text(data.notificationTitleMsg);
            $("#notificationModal").modal("show");

            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        },
    });
}

function selectAttribute(e) {
    e.preventDefault();

    var $productContainer = $(this).closest(".set-item");
    if (!$productContainer.length) {
        $productContainer = $(this).closest(".product-detail");
    }
    base.attributeSelect(e.currentTarget.value, $productContainer);

    var notifyWindowUrl = e.currentTarget.selectedOptions[0].dataset.attrUrl;

    // remove disabled attribute from option with 'notify me'

    $.ajax({
        url: e.currentTarget.value,
        method: "GET",
        success: function (data) {
            var attrs = data.product.variationAttributes;
            attrs.forEach(function (attr) {
                attr.values.forEach(function (attrValue) {
                    var $attr = '[data-attr="' + attr.id + '"]';
                    var $attrValue = $productContainer.find(
                        $attr + ' [data-attr-value="' + attrValue.value + '"]'
                    );
                    $attrValue
                        .attr("value", attrValue.url)
                        .removeAttr("disabled");
                });
            });
            if (notifyWindowUrl) {
                getModalHtmlElement();
                fillModalElement(notifyWindowUrl);
            }
        },
        error: function () {
            $.spinner().stop();
        },
    });
}

function notificationSubmitHandler(e) {
    var $form = $("form.notify-form");
    e.preventDefault();
    // create modal window
    getModalHtmlElement();
    var url = $form.attr("action");
    $("form.notify-form").trigger("notify:submit", e);
    $.ajax({
        url: url,
        type: "post",
        dataType: "json",
        data: $form.serialize(),
        success: function (data) {
            // fill modal window
            var buttonString =
                '<button type="button" class="btn btn-block btn-primary pull-right" data-dismiss="modal">' +
                '   <span aria-hidden="true">Close</span>' +
                '   <span class="sr-only"> </span>' +
                "</button>";
            $(".modal-body").empty();
            $(".modal-body").text(data.notificationSuccessMsg);
            $(".modal-header-text").text(data.notificationSuccessTitle);
            $(".modal-footer").html(buttonString);
            $("#notificationModal .modal-header .close .sr-only").text(
                data.closeButtonText
            );
            $("#notificationModal").modal("show");
        },
        error: function (err) {
            if (err.responseJSON.redirectUrl) {
                window.location.href = err.responseJSON.redirectUrl;
            }
            $form.spinner().stop();
        },
    });
    return false;
}

$(document).ready(function () {
    $(document)
        .off("change", 'select[class*="select-"], .options-select')
        .on(
            "change",
            'select[class*="select-"], .options-select',
            selectAttribute
        );
    $(document).on("submit", "form.notify-form", notificationSubmitHandler);
    base.selectAttribute = selectAttribute;
    module.exports = {
        selectAttribute: selectAttribute,
        notificationSubmitHandler: notificationSubmitHandler,
    };
});
