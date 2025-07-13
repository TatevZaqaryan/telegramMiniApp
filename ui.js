// ui.js - Օգտատիրոջ ինտերֆեյսի (UI) հետ կապված ֆունկցիաներ

// Ստանում ենք անհրաժեշտ DOM էլեմենտները
const messageBox = document.getElementById('message-box');
const confirmationModal = document.getElementById('confirmation-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const okModalBtn = document.getElementById('ok-modal-btn');

// Զամբյուղի մոդալի էլեմենտներ
const cartModal = document.getElementById('cart-modal');
const closeCartModalBtn = document.getElementById('close-cart-modal-btn');
const cartModalItemsList = document.getElementById('cart-modal-items-list');
const emptyCartModalMessage = document.getElementById('empty-cart-modal-message');
const cartModalTotalPrice = document.getElementById('cart-modal-total-price');
const placeOrderModalBtn = document.getElementById('place-order-modal-btn');
const customerNameInput = document.getElementById('customer-name');
const customerPhoneInput = document.getElementById('customer-phone');
const deliveryAddressInput = document.getElementById('delivery-address');


// Ֆունկցիա՝ հաղորդագրություն ցուցադրելու համար (օգտագործում է Telegram.WebApp.showAlert, եթե հասանելի է)
function showMessageBox(message, duration = 2000) {
    const TelegramWebApp = window.Telegram.WebApp;
    if (TelegramWebApp && TelegramWebApp.showAlert) {
        try {
            TelegramWebApp.showAlert(message);
        } catch (e) {
            console.warn("Telegram WebApp.showAlert failed, falling back to local message box:", e);
            messageBox.textContent = message;
            messageBox.style.display = 'block';
            setTimeout(() => {
                messageBox.style.display = 'none';
            }, duration);
        }
    } else {
        messageBox.textContent = message;
        messageBox.style.display = 'block';
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, duration);
    }
}

// Ֆունկցիա՝ զամբյուղի ցուցադրումը և ընդհանուր գումարը թարմացնելու համար (հիմնական էջի համար)
function updateCartDisplay(cart) {
    let totalItemsInCart = 0;
    let totalCartPrice = 0;

    document.querySelectorAll('.item-card').forEach(card => {
        const itemId = card.dataset.id;
        const addBtn = card.querySelector('.add-btn');
        const quantityControl = card.querySelector('.quantity-control');
        const quantityDisplay = card.querySelector('.quantity-display');

        if (cart[itemId] && cart[itemId].quantity > 0) {
            addBtn.classList.add('hidden');
            quantityControl.classList.remove('hidden');
            quantityDisplay.textContent = cart[itemId].quantity;
            totalItemsInCart += cart[itemId].quantity;
            totalCartPrice += cart[itemId].price * cart[itemId].quantity;
        } else {
            addBtn.classList.remove('hidden');
            quantityControl.classList.add('hidden');
            quantityDisplay.textContent = '0';
        }
    });

    // Թարմացնում ենք Telegram-ի MainButton-ի տեսանելիությունը և վիճակը
    const TelegramWebApp = window.Telegram.WebApp;
    if (TelegramWebApp && TelegramWebApp.MainButton) {
        if (totalItemsInCart > 0) {
            TelegramWebApp.MainButton.show();
            TelegramWebApp.MainButton.enable();
            TelegramWebApp.MainButton.setText(`VIEW ORDER (${totalItemsInCart} items - $${totalCartPrice.toFixed(2)})`);
        } else {
            TelegramWebApp.MainButton.hide();
            TelegramWebApp.MainButton.disable();
            TelegramWebApp.MainButton.setText('VIEW ORDER');
        }
    }

    // Թարմացնում ենք զամբյուղի մոդալի ցուցադրումը ամեն անգամ, երբ զամբյուղը փոխվում է
    renderCartItemsInModal(cart);
}

// Ֆունկցիա՝ զամբյուղի ապրանքները մոդալում ցուցադրելու համար
function renderCartItemsInModal(cart) {
    cartModalItemsList.innerHTML = ''; // Մաքրում ենք մոդալի ցուցադրումը
    let total = 0;
    let hasItems = false;

    for (const id in cart) {
        const item = cart[id];
        if (item.quantity > 0) {
            hasItems = true;
            total += item.price * item.quantity;

            const cartItemDiv = document.createElement('div');
            cartItemDiv.className = 'cart-modal-item';
            cartItemDiv.innerHTML = `
                <span class="text-gray-300 font-medium">${item.name}</span>
                <div class="flex items-center cart-modal-quantity-control">
                    <button data-id="${id}" data-action="decrease">-</button>
                    <span class="mx-2">${item.quantity}</span>
                    <button data-id="${id}" data-action="increase">+</button>
                </div>
                <span class="text-gray-300 font-semibold">$${(item.price * item.quantity).toFixed(2)}</span>
            `;
            cartModalItemsList.appendChild(cartItemDiv);
        }
    }

    cartModalTotalPrice.textContent = `$${total.toFixed(2)}`;
    emptyCartModalMessage.style.display = hasItems ? 'none' : 'block';

    // Ակտիվացնում/ապաակտիվացնում ենք "Կատարել Պատվեր" կոճակը մոդալում
    // Այն ակտիվ է, եթե կան ապրանքներ և լրացված են առաքման դաշտերը
    placeOrderModalBtn.disabled = !(hasItems && customerNameInput.value.trim() && customerPhoneInput.value.trim() && deliveryAddressInput.value.trim());
}

// Ֆունկցիա՝ հաստատման մոդալը ցուցադրելու համար
function showConfirmationModal() {
    confirmationModal.classList.remove('hidden');
}

// Ֆունկցիա՝ հաստատման մոդալը թաքցնելու համար
function hideConfirmationModal() {
    confirmationModal.classList.add('hidden');
    const TelegramWebApp = window.Telegram.WebApp;
    if (TelegramWebApp && TelegramWebApp.close) {
        TelegramWebApp.close(); // Փակում ենք Mini App-ը հաստատումից հետո
    }
}

// Ֆունկցիա՝ զամբյուղի մոդալը ցուցադրելու համար
function showCartModal() {
    cartModal.classList.remove('hidden');
    // Թարմացնում ենք մոդալի տվյալները ամեն անգամ, երբ այն բացվում է
    // (cart փոփոխականը գլոբալ է և հասանելի է main.js-ից)
    // Ուղղակիորեն կանչել updateCartDisplay(cart) main.js-ից
}

// Ֆունկցիա՝ զամբյուղի մոդալը թաքցնելու համար
function hideCartModal() {
    cartModal.classList.add('hidden');
}

// Մոդալի փակման կոճակների իրադարձությունների լսիչներ
closeModalBtn.addEventListener('click', hideConfirmationModal);
okModalBtn.addEventListener('click', hideConfirmationModal);
closeCartModalBtn.addEventListener('click', hideCartModal);

// Իրադարձությունների լսիչ՝ զամբյուղի մոդալում քանակը կառավարելու համար
cartModalItemsList.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (button) {
        const id = button.dataset.id;
        const action = button.dataset.action;
        // Կանչում ենք գլոբալ ֆունկցիա main.js-ից՝ զամբյուղը փոփոխելու համար
        // Այս ֆունկցիան պետք է լինի main.js-ում և հասանելի լինի գլոբալ
        if (typeof handleCartQuantityChange === 'function') {
            handleCartQuantityChange(id, action);
        }
    }
});

// Իրադարձությունների լսիչներ մուտքագրման դաշտերի համար՝ պատվերի կոճակը ակտիվացնելու/ապաակտիվացնելու համար
customerNameInput.addEventListener('input', () => updateCartDisplay(window.cart));
customerPhoneInput.addEventListener('input', () => updateCartDisplay(window.cart));
deliveryAddressInput.addEventListener('input', () => updateCartDisplay(window.cart));
