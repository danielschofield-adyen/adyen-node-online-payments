const clientKey = document.getElementById("clientKey").innerHTML;
const { AdyenCheckout, Dropin } = window.AdyenWeb;

// Used to finalize a checkout call in case of redirect
const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('sessionId'); // Unique identifier for the payment session
const redirectResult = urlParams.get('redirectResult');



async function startCheckout() {
  try {
    const paymentMethodsResponse = await fetch('/api/paymentMethods', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }).then(response => response.json());

    const configuration = {
      paymentMethodsResponse: paymentMethodsResponse,
      clientKey,
      environment: "test",
      amount: {
        value: 10000,
        currency: 'AUD'
      },
      locale: "en_AU",
      countryCode: 'AU',
      showPayButton: true,
      // override Security Code label
      translations: {
        'en-US': {
          'creditCard.securityCode.label': 'CVV/CVC'
        }
      },
      onSubmit: async (state, component, actions) => {
        handleOnSubmit(state, component, actions);
      },
      onPaymentCompleted: (result, component) => {
        handleOnPaymentCompleted(result.resultCode);
      },
      onPaymentFailed: (result, component) => {
        handleOnPaymentFailed(result.resultCode);
      },
      onError: (error, component) => {
        handleOnError(error, component);
      },
      // Used for the Native 3DS2 Authentication flow, see: https://docs.adyen.com/online-payments/3d-secure/native-3ds2/
      onAdditionalDetails: async (state, component, actions) => {
        handleOnAdditionalDetails(state, component, actions);
      }
    };

    // Start the AdyenCheckout and mount the element onto the 'payment' div.
    const adyenCheckout = await AdyenCheckout(configuration);
    const dropin = new Dropin(adyenCheckout, {
      paymentMethodsConfiguration: {
        card: cardConfiguration,
        googlepay: googlepayConfiguration
      }
    }).mount('#dropin-container');

  } catch (error) {
    console.error(error);
    alert("Error occurred. Look at console for details.");
  }
}

async function handleOnSubmit(state, component, actions){
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
}

async function onHandleAdditionalDetails(state, component, actions){
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

function handleOnError(error, component){
  console.error("onError", error.name, error.message, error.stack, component);
  window.location.href = "/result/error";
}

// Function to handle payment completion redirects
function handleOnPaymentCompleted(resultCode) {
  console.info("onPaymentCompleted", result, component);
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
  console.info("onPaymentFailed", result, component);
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



async function handleOnChange(state){
  console.info("handleOnChange",state);
  if(state.data.paymentMethod.encryptedCardNumber) {
    try {
      console.info("Encrypted card number available - /cardDetails Request",state);
      const cardNumber = {
        encryptedCardNumber : state.data.paymentMethod.encryptedCardNumber
      }

    const cardDetailsResponse = await fetch('/api/payments/cardDetails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: cardNumber ? JSON.stringify(cardNumber) : ""
    }).then(response => response.json());

    console.info("cardDetails - Response",JSON.stringify(cardDetailsResponse, 0, 2));

    //console.info("incrementing state.amount.value. Old Value: ", state.amount.value);
    //state.amount.value = state.amount.value + 100;
    //console.info("incrementing state.amount.value. New Value: ", state.amount.value);
  
  } catch (error) {
    console.error(error);
    alert("Error occurred. Look at console for details");
  }
}
}

async function handleOnBinValue(binValue){
  console.info("handleOnBinValue",JSON.stringify(binValue,0,2));

  if(binValue.encryptedBin)
  {
    try{
      console.info("Encrypted Bin value available - /cardDetails Request",binValue);

      const cardNumber = {
        encryptedCardNumber : binValue.encryptedBin
      }

      const cardDetailsResponse = await makeCardDetails(cardNumber);

      console.info("cardDetails - Response",JSON.stringify(cardDetailsResponse, 0, 2));

    } catch (error) {

    }
  }
}

async function handleOnFieldValid(field){
  console.info("handleOnFieldValid", field);
  if(field.isValid) {

  }
}

async function handleOnBinLookup(state){
  console.info("handleOnBinLookup", state);
}

const cardConfiguration = {
  showBrandIcon: true,
  hasHolderName: true,
  holderNameRequired: true,
  name: "Credit or debit card",
  amount: {
    value: 10000,
    currency: "AUD",
  },
  placeholders: {
    cardNumber: '1234 5678 9012 3456',
    expiryDate: 'MM/YY',
    securityCodeThreeDigits: '123',
    securityCodeFourDigits: '1234',
    holderName: 'J. Smith'
  },
  onChange: async (state) => {
    handleOnChange(state);
  },
  onBinValue: async (binValue) => {
    handleOnBinValue(binValue);
  },
  onFieldValid: async (field) => {
    handleOnFieldValid(field);
  },
  onBinLookup: async (state) => {
    handleOnBinLookup(state);
  }
}

const googlepayConfiguration = {
  amount: {
    value: 1000,
    currency:"AUD"
  },
  countryCode:"AU",
  environment:"TEST",
  onChange: async (state) => {
    handleOnChange(state);
  }
}

startCheckout();
