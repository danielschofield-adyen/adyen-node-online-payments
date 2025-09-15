const clientKey = document.getElementById("clientKey").innerHTML;
const { AdyenCheckout, Card } = window.AdyenWeb;

// Function to create AdyenCheckout instance
async function createAdyenCheckout(paymentMethodsResponse) {
  return AdyenCheckout({
    paymentMethodsResponse: paymentMethodsResponse,
    clientKey,
    environment: "test",
    amount: {
      value: 0,
      currency: 'AUD'
    },
    locale: "en_US",
    countryCode: 'AU',
    showPayButton: true,
    // override Security Code label
    translations: {
      'en-US': {
        'creditCard.securityCode.label': 'CVV/CVC'
      }
    },
    onSubmit: async (state, component, actions) => {
      console.info("onSubmit", state, component, actions);
      try {
        if (state.isValid) {
          const { action, order, resultCode } = await fetch("/api/payments", {
            method: "POST",
            body: state.data ? JSON.stringify(state.data) : "",
            headers: {
              "Content-Type": "application/json",
            }
          }).then(response => response.json());

          if (!resultCode) {
            console.warn("reject");
            actions.reject();
          }

          actions.resolve({
            resultCode,
            action,
            order
          });
        }
      } catch (error) {
        console.error(error);
        actions.reject();
      }
    },
    onPaymentCompleted: (result, component) => {
      console.info("onPaymentCompleted", result, component);
      handleOnPaymentCompleted(result.resultCode);
    },
    onPaymentFailed: (result, component) => {
      console.info("onPaymentFailed", result, component);
      handleOnPaymentFailed(result.resultCode);
    },
    onError: (error, component) => {
      console.error("onError", error.name, error.message, error.stack, component);
      window.location.href = "/result/error";
    },
    // Used for the Native 3DS2 Authentication flow, see: https://docs.adyen.com/online-payments/3d-secure/native-3ds2/
    onAdditionalDetails: async (state, component, actions) => {
      console.info("onAdditionalDetails", state, component);
      try {
        const { resultCode } = await fetch("/api/payments/details", {
          method: "POST",
          body: state.data ? JSON.stringify(state.data) : "",
          headers: {
            "Content-Type": "application/json",
          }
        }).then(response => response.json());

        if (!resultCode) {
          console.warn("reject");
          actions.reject();
        }

        actions.resolve({ resultCode });
      } catch (error) {
        console.error(error);
        actions.reject();
      }
    }
  });
}

// Function to handle payment completion redirects
function handleOnPaymentCompleted(resultCode) {
  switch (resultCode) {
    case "Authorised":
      window.location.href = "/result/success";
      break;
    case "Pending":
    case "Received":
      window.location.href = "/result/pending";
      break;
    default:
      window.location.href = "/result/error";
      break;
  }
}

// Function to handle payment failure redirects
function handleOnPaymentFailed(resultCode) {
  switch (resultCode) {
    case "Cancelled":
    case "Refused":
      window.location.href = "/result/failed";
      break;
    default:
      window.location.href = "/result/error";
      break;
  }
}


const checkoutObj = null;

// Function to start checkout
async function startCheckout() {
  try {
    const paymentMethodsResponse = await fetch('/api/paymentMethods', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }).then(response => response.json());

    const checkout = await createAdyenCheckout(paymentMethodsResponse);
    const card = new Card(checkout, {
      // Optional configuration.
      billingAddressRequired: false, // when true show the billing address input fields and mark them as required.
      showBrandIcon: true, // when false not showing the brand logo
      hasHolderName: true, // show holder name
      holderNameRequired: true, // make holder name mandatory
      // configure placeholders
      placeholders: {
        cardNumber: "1234 5678 9012 3456",
        expiryDate: "MM/YY",
        securityCodeThreeDigits: "123",
        securityCodeFourDigits: "1234",
        holderName: "J. Smith",
      },
      onChange: async (state) => {
        console.info("onChange", state);
        handleOnChange(state);
      },
      onBinValue: async (binValue) => {
        console.info("onBinValue", binValue);
        handleOnBinValue(binValue);
      },
      onFieldValid: async (field) => {
        console.info("onFieldValid", field);
        handleOnFieldValid(field);
      },
      onBinLookup: async (state) => {
        console.info("onBinLookup", state);
        handleOnBinLookup(state);
      }
    }
    ).mount('#component-container');

  } catch (error) {
    console.error(error);
    alert("Error occurred. Look at console for details");
  }
}

  async function handleOnChange(state) {
    console.info("handleOnChange", state);
    if (state.data.paymentMethod.encryptedCardNumber) {
      try {
        console.info("Encrypted card number available - /cardDetails Request", state);
        const cardNumber = {
          encryptedCardNumber: state.data.paymentMethod.encryptedCardNumber,
        };

        const cardDetailsResponse = await fetch("/api/payments/cardDetails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: cardNumber ? JSON.stringify(cardNumber) : "",
        }).then((response) => response.json());

        console.info("cardDetails - Response", JSON.stringify(cardDetailsResponse, 0, 2));

        //console.info("incrementing state.amount.value. Old Value: ", state.amount.value);
        //state.amount.value = state.amount.value + 100;
        //console.info("incrementing state.amount.value. New Value: ", state.amount.value);
      } catch (error) {
        console.error(error);
        alert("Error occurred. Look at console for details");
      }
    }
  }

  async function handleOnBinValue(binValue) {
    console.info("handleOnBinValue", JSON.stringify(binValue, 0, 2));

    if (binValue.encryptedBin) {
      try {
        console.info("Encrypted Bin value available - /cardDetails Request", binValue);

        const cardNumber = {
          encryptedCardNumber: binValue.encryptedBin,
        };

        const cardDetailsResponse = await makeCardDetails(cardNumber);
        cardDetailsResponse.forEach((element) => {});
        const surchargePerc = getSurchargeForBrand(cardDetailsResponse.brand);
      } catch (error) {}
    }
  }

  async function handleOnFieldValid (field) {
    console.info("handleOnFieldValid", field);
    if (field.isValid) {
    }
  }

  async function handleOnBinLookup (card) {
    console.info("handleOnBinLookup", card);
  }

startCheckout();
