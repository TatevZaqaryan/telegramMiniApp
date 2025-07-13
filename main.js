// main.js - Հիմնական հավելվածի տրամաբանություն և իրադարձությունների լսիչներ

// Գլոբալ փոփոխական՝ զամբյուղի համար
let cart = {}; // Պահում է զամբյուղի ապրանքները: { itemId: { name, price, quantity } }

// Ստանում ենք անհրաժեշտ DOM էլեմենտները
const menuItems = document.getElementById('menu-items');
const placeOrderBtn = document.getElementById('place-order-btn');
const customerNameInput = document.getElementById('customer-name');
const customerPhoneInput = document.getElementById('customer-phone');
const deliveryAddressInput = document.getElementById('delivery-address');

// Ինիցիալիզացնում ենք Telegram Web App SDK-ը
const TelegramWebApp = window.Telegram.WebApp;
if (TelegramWebApp) {
    TelegramWebApp.ready();
    TelegramWebApp.expand(); // Ընդլայնում ենք Mini App-ը ամբողջ էկրանին
    TelegramWebApp.MainButton.setText('Կատարել Պատվեր');
    // Telegram-ի MainButton-ի սեղմման իրադարձության լսիչ
    TelegramWebApp.MainButton.onClick(function() {
        placeOrder(); // Գործարկում ենք պատվերի տրամաբանությունը, երբ MainButton-ը սեղմվում է
    });
    TelegramWebApp.MainButton.hide(); // Սկզբում թաքցնում ենք հիմնական կոճակը, մենք կկառավարենք այն
} else {
    console.warn("Telegram Web App SDK not found. Running in standalone mode.");
}

// Իրադարձությունների լսիչ՝ զամբյուղում ապրանքներ ավելացնելու համար
menuItems.addEventListener('click', (event) => {
    const button = event.target.closest('.add-to-cart-btn');
    if (button) {
        const id = button.dataset.id;
        const name = button.dataset.name;
        const price = parseInt(button.dataset.price);

        if (cart[id]) {
            cart[id].quantity++;
        } else {
            cart[id] = { name, price, quantity: 1 };
        }
        updateCartDisplay(cart); // Թարմացնում ենք UI-ը ui.js-ից
        showMessageBox(`${name} ավելացվեց զամբյուղում։`); // Ցուցադրում ենք հաղորդագրություն ui.js-ից
    }
});

// Իրադարձությունների լսիչ՝ զամբյուղում քանակը կառավարելու համար
document.getElementById('cart-items-list').addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (button) {
        const id = button.dataset.id;
        const action = button.dataset.action;

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
});

// Իրադարձությունների լսիչներ մուտքագրման դաշտերի համար՝ պատվերի կոճակը ակտիվացնելու/ապաակտիվացնելու համար
customerNameInput.addEventListener('input', () => updateCartDisplay(cart));
customerPhoneInput.addEventListener('input', () => updateCartDisplay(cart));
deliveryAddressInput.addEventListener('input', () => updateCartDisplay(cart));

// Ֆունկցիա՝ պատվերը կատարելու համար
function placeOrder() {
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
        items: Object.values(cart).filter(item => item.quantity > 0), // Ներառում ենք միայն ապրանքները, որոնց քանակը > 0 է
        totalPrice: parseFloat(document.getElementById('total-price').textContent.replace(' ֏', '').replace(/,/g, '')),
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
        showConfirmationModal(); // Ցուցադրում ենք հաստատման մոդալը ui.js-ից
        // Ընտրովի՝ մաքրում ենք զամբյուղը պատվերն ուղարկելուց հետո
        cart = {};
        customerNameInput.value = '';
        customerPhoneInput.value = '';
        deliveryAddressInput.value = '';
        updateCartDisplay(cart); // Թարմացնում ենք UI-ը ui.js-ից
    } else {
        showMessageBox("Պատվերը չկարողացավ ուղարկվել։ Telegram Web App SDK-ը հասանելի չէ։ (Սա սիմուլյացիա է)", 3000);
        console.log("Simulated Order Data:", orderJson);
        // Անկախ ռեժիմում, կարող ենք ցուցադրել տեղական հաստատում
        showConfirmationModal(); // Ցուցադրում ենք հաստատման մոդալը ui.js-ից
        cart = {};
        customerNameInput.value = '';
        customerPhoneInput.value = '';
        deliveryAddressInput.value = '';
        updateCartDisplay(cart); // Թարմացնում ենք UI-ը ui.js-ից
    }
}

// Իրադարձությունների լսիչ՝ պատվերի կոճակի համար (անկախ ռեժիմի համար)
placeOrderBtn.addEventListener('click', placeOrder);

// Սկզբնական ցուցադրման թարմացում, երբ էջը բեռնվում է
updateCartDisplay(cart);
