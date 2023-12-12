function applyCoupon() {
    const userCouponCode = document.getElementById('userCouponCode').value;
    const couponData = userCouponCode

    fetch('/coupon-apply', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                couponData
            })
        }).then((response) => {
            if (response.status === 200) {
                return response.json();
            } else {
                throw new Error('Coupon not found');
            }
        })
        .then((data) => {
            // Successful coupon application
            Swal.fire({
                icon: 'success',
                title: 'Coupon Applied',
                text: `Coupon ${data.couponName} applied successfully!`,
            })
            .then(()=>{
                location.reload();
            })
        })
        .catch((error) => {
            // Coupon not found
            Swal.fire({
                icon: 'error',
                title: 'Coupon Error',
                text: error.message || 'Coupon not found',
            });
        });
}


function removeCoupon() {
    fetch('/coupon-remove', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Failed to remove coupon');
    })
    .then(data => {
      if (data.success) {
        Swal.fire('Success', 'Coupon removed successfully', 'success')
        .then(()=>{
            location.reload();
        })
      } else {
        Swal.fire('Error', data.message, 'error');
      }
    })
    .catch(error => {
      console.error('Error removing coupon:', error);
      Swal.fire('Error', 'Failed to remove coupon', 'error');
    });
}



$(document).ready(function () {
    // Function to validate the form

    document.getElementById('saveAddress').addEventListener('click', function () {
        // Validate and save the address
        if (validateForm()) {
            saveAddress();
        }
    });

    function validateForm() {
        var valid = true;
        var addressType = $('#addressType').val();
        var houseNo = $('#houseNo').val().trim();
        var street = $('#street').val().trim();
        var pincode = $('#pincode').val().trim();
        var city = $('#city').val().trim();
        var district = $('#district').val().trim();
        var state = $('#state').val().trim();
        var country = $('#country').val().trim();
        // Clear previous errors
        clearErrors();

        // Validation rules
        if (!addressType) {
            valid = false;
            $('#addressTypeError').text('Type of Address is required')
        }
        if (!houseNo) {
            valid = false;
            $('#houseNoError').text('House No is required.');
        }
        if (!street) {
            valid = false;
            $('#streetError').text('Street is required.');
        }
        if (!pincode || pincode.length !== 6 || isNaN(pincode)) {
            valid = false;
            $('#pincodeError').text('Pincode must be a 6-digit number.');
        }
        if (!city || !/^[A-Za-z\s]+$/.test(city)) {
            valid = false;
            $('#cityError').text('City is required.');
        }
        if (!district) {
            valid = false;
            $('#districtError').text('District is Required')
        }
        if (!state) {
            valid = false;
            $('#stateError').text('State is required.');
        }
        if (!country || /\d/.test(country)) {
            valid = false;
            $('#countryError').text('Country is required and should not contain numbers.');
        }

        return valid;
    }

    function clearErrors() {
        $('#addressTypeError').text();
        $('#houseNoError').text('');
        $('#streetError').text('');
        $('#pincodeError').text('');
        $('#cityError').text('');
        $('#districtError').text('')
        $('#stateError').text('');
        $('#countryError').text('');
    }


    function saveAddress() {
        var addressData = {
            addressType: $('#addressType').val(),
            houseNo: $('#houseNo').val(),
            street: $('#street').val(),
            landmark: $('#landmark').val(),
            pincode: $('#pincode').val(),
            city: $('#city').val(),
            district: $('#district').val(),
            state: $('#state').val(),
            country: $('#country').val()
        };
        fetch('/profile/addAddress', {
                method: 'POST',
                body: JSON.stringify(addressData),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'success...',
                        text: 'Address Saved Successfully',
                    });
                    $('#addressModal').modal('hide');
                    window.location.reload()
                } else {
                    Swal.fire({
                        icon: 'warnning',
                        title: 'success...',
                        text: data.message,
                    });
                }
            })
            .catch(function (error) {
                console.error(error);
                alert('An error occurred while saving the address.');
            });
    }
})


//REMOVE ADDRESS
//Edit ADdress
function addressRemove(addressType) {
    // You can use AJAX (e.g., fetch or XMLHttpRequest) to send a DELETE request to the backend

    fetch(`/profile/deleteAddress?addressType=${addressType}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },

        })
        .then((response) => {
            if (response.ok) {
                // Address was successfully deleted
                // You can update the UI or display a message here
                Swal.fire({
                    icon: 'success',
                    title: 'success...',
                    text: 'Address Deleted',
                });
                window.location.reload();
            } else {
                // Handle the error and display an error message
                console.error('Error deleting address:', response.statusText);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}


document.addEventListener("submit", function (event) {
    if (event.target.classList.contains("address-form")) {
        event.preventDefault();

        const form = event.target;
        const addressTypeError = form.querySelector("#addressTypeError");
        const houseNoError = form.querySelector("#edithouseNoError");
        const streetError = form.querySelector("#editstreetError");
        const pincodeError = form.querySelector("#editpincodeError");
        const cityError = form.querySelector("#editcityError");
        const districtError = form.querySelector("#editdistrictError");
        const stateError = form.querySelector("#editstateError");
        const countryError = form.querySelector("#editcountryError");

        const addressType = form.querySelector("#editAddressType").value;
        const houseNo = form.querySelector("#editHouseNo").value.trim();
        const street = form.querySelector("#editStreet").value.trim();
        const pincode = form.querySelector("#editPincode").value;
        const city = form.querySelector("#editCity").value.trim();
        const district = form.querySelector("#editDistrict").value.trim();
        const state = form.querySelector("#editState").value;
        const country = form.querySelector("#editCountry").value.trim();

        let isValid = true;

        if (addressType === "") {
            addressTypeError.textContent = "Address Type is required";
            isValid = false;

        }

        if (houseNo === "") {
            houseNoError.textContent = "House No is required";
            isValid = false;
        } else {
            houseNoError.textContent = "";
        }

        if (street === "") {
            streetError.textContent = "Street is required";
            isValid = false;
        } else {
            streetError.textContent = "";
        }

        if (!/^\d{6}$/.test(pincode)) {
            pincodeError.textContent = "Pincode must be 6 digits";
            isValid = false;
        } else {
            pincodeError.textContent = "";
        }

        if (city === "") {
            cityError.textContent = "City is required";
            isValid = false;
        } else {
            cityError.textContent = "";
        }

        if (district === "") {
            districtError.textContent = "District is required";
            isValid = false;
        } else {
            districtError.textContent = "";
        }

        if (state === "") {
            stateError.textContent = "State is required";
            isValid = false;
        } else {
            stateError.textContent = "";
        }

        if (country === "") {
            countryError.textContent = "Country is required";
            isValid = false;
        } else {
            countryError.textContent = "";
        }

        if (isValid) {

            form.submit();
        }
    }
});

//CASH ON DELEIVERY 
const billTotalElement = document.querySelector(
'.card-footer span:last-child'); // Assuming this selects the correct span
const billTotalText = billTotalElement.textContent;
const billTotal = parseFloat(billTotalText.split(' ')[1]); // Extract the numeric value

console.log('Bill Total:', billTotal);
// Get the relevant elements
const walletRadioButton = document.getElementById('Wallet');
const RazorpayRadio = document.getElementById('Razorpay');
const walletBalance = walletRadioButton.getAttribute('data-balance');
const walletBalanceDisplay = document.getElementById('walletBalanceDisplay');

walletRadioButton.addEventListener('change', function () {
    if (walletRadioButton.checked) {
        // Display the wallet balance when the radio button is selected
        walletBalanceDisplay.textContent =
        `Wallet Balance: ${walletBalance}`; // Update the balance here
    } else {
        // Clear the displayed balance when the radio button is not selected
        walletBalanceDisplay.textContent = '';
    }
});
const cashOnDeliveryRadio = document.getElementById('cashOnDelivery');
const codeSection = document.getElementById('codeSection');
const verificationCodeInput = document.getElementById('verificationCode');
const generatedCodeDisplay = document.getElementById('generatedCode');

// Function to enable or disable the "Proceed to Payment" button

const proceedButton = document.getElementById('proceedButton');


// Add this condition to check 'billTotal' and initially disable the button
if (billTotal === 0) {
    proceedButton.setAttribute('disabled', true);
    Swal.fire("Error", "Please add Some Products", "error");
}
cashOnDeliveryRadio.addEventListener('change', handlePaymentOptionChange);
RazorpayRadio.addEventListener('change', handlePaymentOptionChange);
walletRadioButton.addEventListener('change', handlePaymentOptionChange);


function handlePaymentOptionChange() {
    if (cashOnDeliveryRadio.checked || RazorpayRadio.checked || walletRadioButton.checked) {
        proceedButton.removeAttribute('disabled');
    } else {
        proceedButton.setAttribute('disabled', true);
    }
}





// BACKEND DATA GOINnG 

// Assuming you have a button with the id "proceedButton"

proceedButton.addEventListener("click", () => {

    // Get the selected address type and payment option
    const selectedAddressType = document.querySelector('input[name="selectedAddress"]:checked').value;
    const paymentOption = document.querySelector('input[name="paymentOption"]:checked').value;

    // You can get the product IDs, quantities, and bill total from your page as needed.
    // For example, you might store this data in JavaScript variables.

    // Create a data object to send to the server
    const data = {
        addressType: selectedAddressType,
        paymentOption: paymentOption,
        // Add other data properties as needed
    };
    // Send the data to the server using a fetch request
    fetch("/home/cart/checkout", {
            method: "POST", // Use the appropriate HTTP method
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        })
        .then((response) => response.json())
        .then((result) => {
            if (result.success) {
                // If the response indicates success, show a success message
                if (paymentOption === 'cashOnDelivery') {
                    Swal.fire('Success', 'Cash on Delivery payment processed.', 'success')
                        .then(() => {
                            location.href = `/home/cart/order-confirmation/${result.orderId}`;
                        });
                } else if (paymentOption === 'Wallet') {
                    Swal.fire('Success', 'Wallet payment processed.', 'success')
                        .then(() => {
                            location.href = `/home/cart/order-confirmation/${result.orderId}`;
                        });
                } else if (paymentOption === 'Razorpay') {

                    alert("Razorpay Payment Option"); // Debugging line
                    initiateRazorpayPayment(result.order.orderId, result.order.oId, result.amount,
                        result, result.order);
                }
            } else if (result.success === false && result.error ===
                "Not enough stock for some items") {
                // Trigger the SweetAlert pop-up
                Swal.fire({
                    icon: 'error', // Error icon
                    title: 'Not Enough Stock',
                    text: 'There is not enough stock for some items.',
                });
                // You can redirect to a payment gateway or perform further actions here.
            } else {
                // If there's an error, show an error message
                Swal.fire("Error", "An error occurred. Please try again later." + error.message,
                    "error");
            }
        })
        .catch((error) => {
            console.error("Error:", error);
        });
});


// Define a function to initiate the Razorpay payment
function initiateRazorpayPayment(orderId, oId, amount, res, order) {
    console.log(res)
    console.log(orderId)
    var options = {
        key: "" + res.key_id + "", // Replace with your Razorpay key
        amount: amount, // Amount in paise (e.g., 1000 for ₹10)
        currency: 'INR',
        name: 'SMEXY',
        description: 'Payment for your order',
        order_id: res.order.orderId,
        handler: function (response) {
            console.log(response)
            const paymentData = {
                order: order,
                orderId: oId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: orderId,
                razorpay_signature: response.razorpay_signature,
                // Add any other necessary data
            };
            fetch('/home/cart/verify-payment', {
                    method: 'POST',
                    body: JSON.stringify(paymentData),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
                .then((response) => response.json())
                .then((data) => {
                    // Handle the response from the server (e.g., display a success message)
                    if (data.success) {
                        Swal.fire('Success', 'Online payment processed.', 'success')
                            .then(() => {
                                location.href =
                                    `/home/cart/order-confirmation/${data.updatedOrder._id}`
                            });

                    } else {
                        Swal.fire('Error', 'Payment failed', 'error')
                            .then(() => {
                                location.href = '/home/cart/payment-failed';
                            });
                    }
                })
                .catch((error) => {
                    // Handle errors from the server
                    console.error(error);
                });
        },
        prefill: {
            "contact": "" + res.contact + "",
            "name": "" + res.name + "",
            "email": "" + res.email + "" // Pre-fill customer's contact number
        },
        notes: {
            address: "" + res.address + "", // You can provide additional notes if needed
        },
        theme: {
            color: '#19B8A2', // Customize the color of the Razorpay checkout button
        },
    };

    var rzp = new Razorpay(options);
    rzp.on('payment.failed', function (response) {
        console.log(response)
        alert("Payment Failed");
    });

    rzp.open();
}