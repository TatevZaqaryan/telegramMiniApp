// main.js - Հիմնական հավելվածի տրամաբանություն և իրադարձությունների լսիչներ

console.log("main.js script started.");

// Գլոբալ փոփոխական՝ զամբյուղի համար
let cart = loadCartFromStorage(); // Վերականգնում ենք զամբյուղը localStorage-ից
window.cart = cart; // Դարձնում ենք cart-ը գլոբալ, որպեսզի ui.js-ը կարողանա մուտք գործել

// Ստանում ենք անհրաժեշտ DOM էլեմենտները
const menuItems = document.getElementById('menu-items');
const cancelButton = document.getElementById('cancel-button');

// Ինիցիալիզացնում ենք Telegram Web App SDK-ը
const TelegramWebApp = window.Telegram.WebApp;
if (TelegramWebApp) {
    TelegramWebApp.ready();
    TelegramWebApp.expand();
    TelegramWebApp.MainButton.setText('VIEW ORDER');
    TelegramWebApp.MainButton.onClick(function() {
        showCartModal();
    });
    TelegramWebApp.MainButton.show();
} else {
    console.warn("Telegram Web App SDK not found. Running in standalone mode.");
}

// Ֆունկցիա՝ զամբյուղը localStorage-ում պահպանելու համար
function saveCartToStorage() {
    try {
        localStorage.setItem('cart', JSON.stringify(cart));
    } catch (error) {
        console.error("Failed to save cart to localStorage:", error);
    }
}

// Ֆունկցիա՝ զամբյուղը localStorage-ից վերականգնելու համար
function loadCartFromStorage() {
    try {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : {};
    } catch (error) {
        console.error("Failed to load cart from localStorage:", error);
        return {};
    }
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
        saveCartToStorage(); // Պահպանում ենք զամբյուղը
        updateCartDisplay(cart);
        showMessageBox(`${name} ավելացվեց զամբյուղում։`);
    }
});

// Իրադարձությունների լսիչ՝ զամբյուղում քանակը կառավարելու համար (հիմնական էջի քարտերի վրա)
menuItems.addEventListener('click', (event) => {
    const button = event.target.closest('.quantity-control button');
    if (button) {
        const card = button.closest('.item-card');
        const id = card.dataset.id;
        const action = button.dataset.action;
        handleCartQuantityChange(id, action);
    }
});

// Ֆունկցիա՝ զամբյուղի քանակը փոփոխելու համար
function handleCartQuantityChange(id, action) {
    if (cart[id]) {
        if (action === 'increase') {
            cart[id].quantity++;
            showMessageBox(`${cart[id].name} քանակը ավելացավ։`);
        } else if (action === 'decrease') {
            cart[id].quantity--;
            if (cart[id].quantity <= 0) {
                showMessageBox(`${cart[id].name} հեռացվեց զամբյուղից։`);
                delete cart[id];
            }
        }
        saveCartToStorage(); // Պահպանում ենք զամբյուղը
        updateCartDisplay(cart);
    }
}
window.handleCartQuantityChange = handleCartQuantityChange;

// Իրադարձությունների լսիչ՝ Cancel կոճակի համար
if (cancelButton) {
    cancelButton.addEventListener('click', () => {
        if (TelegramWebApp && TelegramWebApp.close) {
            TelegramWebApp.close();
        } else {
            showMessageBox("Mini App-ը փակվեց։ (Սիմուլյացիա)");
            console.log("Mini App Closed (Standalone)");
        }
    });
}

// Իրադարձությունների լսիչ՝ պատվերի կոճակի համար մոդալում
if (typeof placeOrderModalBtn !== 'undefined' && placeOrderModalBtn !== null) {
    placeOrderModalBtn.addEventListener('click', () => {
        if (Object.keys(cart).length === 0) {
            showMessageBox("Զամբյուղը դատարկ է։ Խնդրում ենք ավելացնել ապրանքներ։");
            return;
        }

        const customerName = customerNameInput.value.trim();
        const customerPhone = customerPhoneInput.value.trim();
        const deliveryAddress = deliveryAddressInput.value.trim();

        // Վալիդացիայի կանոններ
        if (!customerName || customerName.length < 2) {
            showMessageBox("Անունը պետք է պարունակի առնվազն 2 նիշ։");
            return;
        }
        if (!customerPhone || !/^\+?\d{10,12}$/.test(customerPhone)) {
            showMessageBox("Խնդրում ենք մուտքագրել վավեր հեռախոսահամար։");
            return;
        }
        if (!deliveryAddress || deliveryAddress.length < 5) {
            showMessageBox("Հասցեն պետք է պարունակի առնվազն 5 նիշ։");
            return;
        }

        placeOrderModalBtn.disabled = true;
        placeOrderModalBtn.textContent = 'Բեռնվում է...';

        const orderDetails = {
            items: Object.values(cart).filter(item => item.quantity > 0),
            totalPrice: Object.values(cart).reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2),
            customerInfo: {
                name: customerName,
                phone: customerPhone,
                address: deliveryAddress
            }
        };

        const orderJson = JSON.stringify(orderDetails);

        if (TelegramWebApp && TelegramWebApp.sendData) {
            try {
                TelegramWebApp.sendData(orderJson);
                hideCartModal();
                showConfirmationModal();
                cart = {};
                saveCartToStorage(); // Պահպանում ենք դատարկ զամբյուղը
                customerNameInput.value = '';
                customerPhoneInput.value = '';
                deliveryAddressInput.value = '';
                updateCartDisplay(cart);
            } catch (error) {
                showMessageBox("Պատվերի ուղարկումը ձախողվեց։ Խնդրում ենք փորձել կրկին։", 3000);
                console.error("Order submission failed:", error);
            } finally {
                placeOrderModalBtn.disabled = false;
                placeOrderModalBtn.textContent = 'Կատարել Պատվեր';
            }
        } else {
            showMessageBox("Պատվերը չկարողացավ ուղարկվել։ Telegram Web App SDK-ը հասանելի չէ։", 3000);
            console.log("Simulated Order Data:", orderJson);
            hideCartModal();
            showConfirmationModal();
            cart = {};
            saveCartToStorage();
            customerNameInput.value = '';
            customerPhoneInput.value = '';
            deliveryAddressInput.value = '';
            updateCartDisplay(cart);
            placeOrderModalBtn.disabled = false;
            placeOrderModalBtn.textContent = 'Կատարել Պատվեր';
        }
    });
}

// Սկզբնական ցուցադրման թարմացում
updateCartDisplay(cart);