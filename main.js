// main.js - Հիմնական հավելվածի տրամաբանություն և իրադարձությունների լսիչներ

// Գլոբալ փոփոխական՝ զամբյուղի համար
let cart = {}; // Պահում է զամբյուղի ապրանքները: { itemId: { name, price, quantity } }

// Ստանում ենք անհրաժեշտ DOM էլեմենտները
const menuItems = document.getElementById('menu-items');
const viewOrderBtn = document.getElementById('view-order-btn'); // Նոր VIEW ORDER կոճակ
const cancelButton = document.getElementById('cancel-button'); // Cancel կոճակը հեդերում

// Ինիցիալիզացնում ենք Telegram Web App SDK-ը
const TelegramWebApp = window.Telegram.WebApp;
if (TelegramWebApp) {
    TelegramWebApp.ready();
    TelegramWebApp.expand(); // Ընդլայնում ենք Mini App-ը ամբողջ էկրանին
    TelegramWebApp.MainButton.setText('VIEW ORDER');
    // Telegram-ի MainButton-ի սեղմման իրադարձության լսիչ
    TelegramWebApp.MainButton.onClick(function() {
        // Քանի որ մենք չունենք առանձին պատվերի էջ, այս պահին ուղղակի ցուցադրում ենք հաղորդագրություն
        // Ապագայում այստեղ կլինի պատվերի հաստատման/առաքման տվյալների էջի բացում
        if (Object.keys(cart).length > 0) {
            const orderDetails = {
                items: Object.values(cart).filter(item => item.quantity > 0),
                totalPrice: Object.values(cart).reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)
            };
            showMessageBox(`Ձեր պատվերը պատրաստ է։ Ընդհանուր՝ $${orderDetails.totalPrice}։`);
            // Այստեղ կարող է լինել TelegramWebApp.sendData(JSON.stringify(orderDetails));
            // Բայց քանի որ առաքման տվյալներ չկան, դա դեռ իմաստ չունի
        } else {
            showMessageBox("Զամբյուղը դատարկ է։ Խնդրում ենք ավելացնել ապրանքներ։");
        }
    });
    TelegramWebApp.MainButton.hide(); // Սկզբում թաքցնում ենք հիմնական կոճակը, ui.js-ը կկառավարի այն
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

// Իրադարձությունների լսիչ՝ զամբյուղում քանակը կառավարելու համար
menuItems.addEventListener('click', (event) => {
    const button = event.target.closest('.quantity-control button');
    if (button) {
        const card = button.closest('.item-card');
        const id = card.dataset.id;
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

// Իրադարձությունների լսիչ՝ VIEW ORDER կոճակի համար (անկախ ռեժիմի համար)
viewOrderBtn.addEventListener('click', () => {
    if (Object.keys(cart).length > 0) {
        const orderDetails = {
            items: Object.values(cart).filter(item => item.quantity > 0),
            totalPrice: Object.values(cart).reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)
        };
        showMessageBox(`Ձեր պատվերը պատրաստ է։ Ընդհանուր՝ $${orderDetails.totalPrice}։ (Սիմուլյացիա)`);
        console.log("Simulated Order Data:", orderDetails);
        // Այստեղ կարող է լինել պատվերի հաստատման մոդալի ցուցադրում
        showConfirmationModal();
        cart = {}; // Մաքրում ենք զամբյուղը
        updateCartDisplay(cart);
    } else {
        showMessageBox("Զամբյուղը դատարկ է։ Խնդրում ենք ավելացնել ապրանքներ։");
    }
});

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

// Սկզբնական ցուցադրման թարմացում, երբ էջը բեռնվում է
updateCartDisplay(cart);
