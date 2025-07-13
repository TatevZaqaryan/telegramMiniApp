// main.js - Հիմնական հավելվածի տրամաբանություն և իրադարձությունների լսիչներ

console.log("main.js script started.");

// Գլոբալ փոփոխական՝ զամբյուղի համար
let cart = {}; // Պահում է զամբյուղի ապրանքները: { itemId: { name, price, quantity } }
window.cart = cart; // Դարձնում ենք cart-ը գլոբալ, որպեսզի ui.js-ը կարողանա մուտք գործել

// Ստանում ենք անհրաժեշտ DOM էլեմենտները
const menuItems = document.getElementById('menu-items');
const cancelButton = document.getElementById('cancel-button'); // Cancel կոճակը հեդերում
// Այս էլեմենտները հայտարարվում են ui.js-ում և հասանելի են գլոբալ
// const placeOrderModalBtn = document.getElementById('placeOrderModalBtn');
// const customerNameInput = document.getElementById('customer-name');
// const customerPhoneInput = document.getElementById('customer-phone');
// const deliveryAddressInput = document.getElementById('delivery-address');


// Ինիցիալիզացնում ենք Telegram Web App SDK-ը
const TelegramWebApp = window.Telegram.WebApp;
if (TelegramWebApp) {
    TelegramWebApp.ready();
    TelegramWebApp.expand(); // Ընդլայնում ենք Mini App-ը ամբողջ էկրանին
    TelegramWebApp.MainButton.setText('VIEW ORDER');
    // Telegram-ի MainButton-ի սեղմման իրադարձության լսիչ
    TelegramWebApp.MainButton.onClick(function() {
        showCartModal(); // Ցուցադրում ենք զամբյուղի մոդալը
    });
    TelegramWebApp.MainButton.show(); // Այս տողը ավելացվել է՝ կոճակը միշտ ցուցադրելու համար
    // MainButton-ի վիճակը (ակտիվ/ապաակտիվ) կկառավարվի updateCartDisplay ֆունկցիայի միջոցով
} else {
    console.warn("Telegram Web App SDK not found. Running in standalone mode.");
}

// Իրադարձությունների լսիչ՝ զամբյուղում ապրանքներ ավելացնելու համար
menuItems.addEventListener('click', (event) => {
    const button = event.target.closest('.add-btn');
    if (button) {
        const card = button.closest('.item-card');
        const id = card.dataset.id;
        const name = card.dataset.name;
        const price = parseFloat(card.dataset.price);

        if (cart[id]) {
            cart[id].quantity++;
        } else {
            cart[id] = { name, price, quantity: 1 };
        }
        updateCartDisplay(cart); // Թարմացնում ենք UI-ը ui.js-ից
        showMessageBox(`${name} ավելացվեց զամբյուղում։`); // Ցուցադրում ենք հաղորդագրություն ui.js-ից
    }
});

// Իրադարձությունների լսիչ՝ զամբյուղում քանակը կառավարելու համար (հիմնական էջի քարտերի վրա)
menuItems.addEventListener('click', (event) => {
    const button = event.target.closest('.quantity-control button');
    if (button) {
        const card = button.closest('.item-card');
        const id = card.dataset.id;
        const action = button.dataset.action;
        handleCartQuantityChange(id, action); // Կանչում ենք ընդհանուր ֆունկցիա
    }
});

// Ֆունկցիա՝ զամբյուղի քանակը փոփոխելու համար (օգտագործվում է և՛ հիմնական էջում, և՛ մոդալում)
function handleCartQuantityChange(id, action) {
    if (cart[id]) {
        if (action === 'increase') {
            cart[id].quantity++;
        } else if (action === 'decrease') {
            cart[id].quantity--;
            if (cart[id].quantity <= 0) {
                delete cart[id]; // Հեռացնում ենք ապրանքը, եթե քանակը 0 կամ պակաս է
            }
        }
        updateCartDisplay(cart); // Թարմացնում ենք UI-ը ui.js-ից
    }
}
// Դարձնում ենք ֆունկցիան գլոբալ, որպեսզի ui.js-ը կարողանա մուտք գործել
window.handleCartQuantityChange = handleCartQuantityChange;


// Իրադարձությունների լսիչ՝ Cancel կոճակի համար
if (cancelButton) {
    cancelButton.addEventListener('click', () => {
        if (TelegramWebApp && TelegramWebApp.close) {
            TelegramWebApp.close(); // Փակում ենք Mini App-ը
        } else {
            showMessageBox("Mini App-ը փակվեց։ (Սիմուլյացիա)");
            console.log("Mini App Closed (Standalone)");
        }
    });
}

// Իրադարձությունների լսիչ՝ պատվերի կոճակի համար մոդալում
// placeOrderModalBtn-ը, customerNameInput-ը, customerPhoneInput-ը, deliveryAddressInput-ը
// հայտարարված են ui.js-ում և հասանելի են գլոբալ
if (typeof placeOrderModalBtn !== 'undefined' && placeOrderModalBtn !== null) {
    placeOrderModalBtn.addEventListener('click', () => {
        if (Object.keys(cart).length === 0) {
            showMessageBox("Զամբյուղը դատարկ է։ Խնդրում ենք ավելացնել ապրանքներ։");
            return;
        }

        const customerName = customerNameInput.value.trim();
        const customerPhone = customerPhoneInput.value.trim();
        const deliveryAddress = deliveryAddressInput.value.trim();

        if (!customerName || !customerPhone || !deliveryAddress) {
            showMessageBox("Խնդրում ենք լրացնել առաքման բոլոր տվյալները։");
            return;
        }

        // Պատրաստում ենք պատվերի տվյալները
        const orderDetails = {
            items: Object.values(cart).filter(item => item.quantity > 0),
            totalPrice: Object.values(cart).reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2),
            customerInfo: {
                name: customerName,
                phone: customerPhone,
                address: deliveryAddress
            }
        };

        // Փոխարկում ենք պատվերի մանրամասները JSON տողի
        const orderJson = JSON.stringify(orderDetails);

        if (TelegramWebApp && TelegramWebApp.sendData) {
            TelegramWebApp.sendData(orderJson);
            hideCartModal(); // Թաքցնում ենք զամբյուղի մոդալը
            showConfirmationModal(); // Ցուցադրում ենք հաստատման մոդալը ui.js-ից
            cart = {}; // Մաքրում ենք զամբյուղը
            customerNameInput.value = '';
            customerPhoneInput.value = '';
            deliveryAddressInput.value = '';
            updateCartDisplay(cart); // Թարմացնում ենք UI-ը ui.js-ից
        } else {
            showMessageBox("Պատվերը չկարողացավ ուղարկվել։ Telegram Web App SDK-ը հասանելի չէ։ (Սա սիմուլյացիա է)", 3000);
            console.log("Simulated Order Data:", orderJson);
            hideCartModal();
            showConfirmationModal();
            cart = {};
            customerNameInput.value = '';
            customerPhoneInput.value = '';
            deliveryAddressInput.value = '';
            updateCartDisplay(cart);
        }
    });
}


// Սկզբնական ցուցադրման թարմացում, երբ էջը բեռնվում է
updateCartDisplay(cart);
