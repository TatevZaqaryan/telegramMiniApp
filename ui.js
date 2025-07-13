// ui.js - Օգտատիրոջ ինտերֆեյսի (UI) հետ կապված ֆունկցիաներ

// Ստանում ենք անհրաժեշտ DOM էլեմենտները
const messageBox = document.getElementById('message-box');
const cartItemsList = document.getElementById('cart-items-list');
const totalPriceDisplay = document.getElementById('total-price');
const emptyCartMessage = document.getElementById('empty-cart-message');
const customerNameInput = document.getElementById('customer-name');
const customerPhoneInput = document.getElementById('customer-phone');
const deliveryAddressInput = document.getElementById('delivery-address');
const confirmationModal = document.getElementById('confirmation-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const okModalBtn = document.getElementById('ok-modal-btn');

// Ֆունկցիա՝ հաղորդագրություն ցուցադրելու համար (օգտագործում է Telegram.WebApp.showAlert, եթե հասանելի է)
function showMessageBox(message, duration = 2000) {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.showAlert) {
        window.Telegram.WebApp.showAlert(message);
    } else {
        // Ցուցադրում է տեղական հաղորդագրության արկղ, եթե Telegram Web App SDK-ը հասանելի չէ
        messageBox.textContent = message;
        messageBox.style.display = 'block';
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, duration);
    }
}

// Ֆունկցիա՝ զամբյուղի ցուցադրումը և ընդհանուր գումարը թարմացնելու համար
function updateCartDisplay(cart) {
    cartItemsList.innerHTML = ''; // Մաքրում ենք զամբյուղի ընթացիկ ցուցադրումը
    let total = 0;
    let hasItems = false;

    // Ցիկլով անցնում ենք զամբյուղի ապրանքների վրայով և դրանք ավելացնում UI-ին
    for (const id in cart) {
        const item = cart[id];
        if (item.quantity > 0) {
            hasItems = true;
            total += item.price * item.quantity;

            const cartItemDiv = document.createElement('div');
            cartItemDiv.className = 'cart-item';
            cartItemDiv.innerHTML = `
                <span class="text-gray-700 font-medium">${item.name}</span>
                <div class="flex items-center quantity-control">
                    <button data-id="${id}" data-action="decrease">-</button>
                    <span class="mx-2 font-bold text-gray-800">${item.quantity}</span>
                    <button data-id="${id}" data-action="increase">+</button>
                </div>
                <span class="text-gray-700 font-semibold">${(item.price * item.quantity).toLocaleString()} ֏</span>
            `;
            cartItemsList.appendChild(cartItemDiv);
        }
    }

    totalPriceDisplay.textContent = `${total.toLocaleString()} ֏`; // Թարմացնում ենք ընդհանուր գումարը
    emptyCartMessage.style.display = hasItems ? 'none' : 'block'; // Ցուցադրում/թաքցնում ենք "Զամբյուղը դատարկ է" հաղորդագրությունը

    // Թարմացնում ենք Telegram-ի MainButton-ի տեսանելիությունը և վիճակը
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.MainButton) {
        // Ստուգում ենք՝ արդյոք զամբյուղում կան ապրանքներ և առաքման բոլոր դաշտերը լրացված են
        if (hasItems && customerNameInput.value && customerPhoneInput.value && deliveryAddressInput.value) {
            window.Telegram.WebApp.MainButton.show();
            window.Telegram.WebApp.MainButton.enable();
        } else {
            window.Telegram.WebApp.MainButton.hide(); // Թաքցնում ենք, եթե պատրաստ չէ
            window.Telegram.WebApp.MainButton.disable(); // Անջատում ենք, եթե պատրաստ չէ
        }
        window.Telegram.WebApp.MainButton.setText(`Կատարել Պատվեր (${total.toLocaleString()} ֏)`);
    } else {
        // Անկախ ռեժիմի համար, կառավարում ենք տեղական կոճակը
        const placeOrderBtn = document.getElementById('place-order-btn');
        placeOrderBtn.disabled = !(hasItems && customerNameInput.value && customerPhoneInput.value && deliveryAddressInput.value);
    }
}

// Ֆունկցիա՝ հաստատման մոդալը ցուցադրելու համար
function showConfirmationModal() {
    confirmationModal.classList.remove('hidden');
}

// Ֆունկցիա՝ հաստատման մոդալը թաքցնելու համար
function hideConfirmationModal() {
    confirmationModal.classList.add('hidden');
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.close(); // Փակում ենք Mini App-ը հաստատումից հետո
    }
}

// Մոդալի փակման կոճակների իրադարձությունների լսիչներ
closeModalBtn.addEventListener('click', hideConfirmationModal);
okModalBtn.addEventListener('click', hideConfirmationModal);

// Էքսպորտ ենք անում ֆունկցիաները, որպեսզի դրանք հասանելի լինեն main.js-ում
// Քանի որ մենք չենք օգտագործում մոդուլային համակարգ (օրինակ՝ import/export),
// այս ֆունկցիաները գլոբալ կլինեն, եթե ui.js-ը ներառվի main.js-ից առաջ։
// Որպես այլընտրանք, կարող ենք դրանք ուղղակիորեն վերագրել window օբյեկտին։
// Այս դեպքում, քանի որ ui.js-ը ներառվում է main.js-ից առաջ, դրանք հասանելի կլինեն։
// Ուղղակիորեն DOM էլեմենտներին մուտք գործելու համար դրանք պետք է լինեն այս ֆայլում։
