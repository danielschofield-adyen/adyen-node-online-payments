module.exports = {
  ifeq: function (a, b, options) {
    if (a === b) {
      return options.fn(this);
    }
    return options.inverse(this);
  },

  getSurchargeForBrand: function (brand) {
    switch (brand) {
      case "visa":
        return (surchargePercentage = 0.1);
      case "mc":
        return (surchargePercentage = 0.15);
      case "amex":
        return (surchargePercentage = 0.3);
      default:
        return (surchargePercentage = 0.95);
    }
  },

  makeCardDetails: async function (cardNumber) {
    return await fetch("/api/payments/cardDetails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: cardNumber ? JSON.stringify(cardNumber) : "",
    }).then((response) => response.json());
  },

  getConfig: async function () {
    const config = {
      cardConfig: { data: { billingAddress: {} } },
      applepayConfig: {},
      paypalConfig: { environment: "test", amount: {} },
      paymentMethod: {},
    };

    config.environment = await httpGet("env", "ENVIRONMENT");
    config.clientKey = await httpGet("env", "CHECKOUT_CLIENTKEY");

    config.native3ds2 = document.querySelector("#native3ds2").checked;

    config.openFirstPaymentMethod = document.querySelector("#openFirstPaymentMethod").checked;
    config.openFirstStoredPaymentMethod = document.querySelector("#openFirstStoredPaymentMethod").checked;
    config.showStoredPaymentMethods = document.querySelector("#showStoredPaymentMethods").checked;
    config.showPaymentMethods = document.querySelector("#showPaymentMethods").checked;
    config.showPayButton = document.querySelector("#showPayButton").checked;
    config.showRemovePaymentMethodButton = document.querySelector("#showRemovePaymentMethodButton").checked;

    config.cardConfig.enableStoreDetails = document.querySelector("#enableStoreDetails").checked;
    config.cardConfig.hasHolderName = document.querySelector("#hasHolderName").checked;
    config.cardConfig.holderNameRequired = document.querySelector("#holderNameRequired").checked;
    config.cardConfig.hideCVC = document.querySelector("#hideCVC").checked;
    config.cardConfig.showBrandIcon = document.querySelector("#showBrandIcon").checked;
    config.cardConfig.billingAddressRequired = document.querySelector("#billingAddressRequired").checked;
    config.cardConfig.data.holderName = await httpGet("env", "CARD_HOLDERNAME");
    config.cardConfig.data.billingAddress.city = await httpGet("env", "BILLING_ADDRESS_CITY");

    config.cardConfig.data.billingAddress.country = await httpGet("env", "BILLING_ADDRESS_COUNTRY");
    config.cardConfig.data.billingAddress.houseNumberOrName = await httpGet("env", "BILLING_ADDRESS_HOUSENUMBERORNAME");
    config.cardConfig.data.billingAddress.postalCode = await httpGet("env", "BILLING_ADDRESS_POSTALCODE");
    config.cardConfig.data.billingAddress.stateOrProvince = await httpGet("env", "BILLING_ADDRESS_STATEORPROVINCE");
    config.cardConfig.data.billingAddress.street = await httpGet("env", "BILLING_ADDRESS_STREET");

    config.shopperReference = await httpGet("env", "SHOPPER_REFERENCE");

    return config;
  },
};
