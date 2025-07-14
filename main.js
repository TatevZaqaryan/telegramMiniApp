// main.js - Հիմնական հավելվածի տրամաբանություն և իրադարձությունների լսիչներ

console.log("main.js script started.");

// Գլոբալ փոփոխական՝ զամբյուղի համար
let cart = loadCartFromStorage();
window.cart = cart;

// Գլոբալ փոփոխական՝ ընտրված ապրանքի համար
let selectedItem = null;

// Ստանում ենք անհրաժեշտ DOM էլեմենտները
const menuItems = document.getElementById('menu-items');
const cancelButton = document.getElementById('cancel-button');
const subtypeModal = document.getElementById('subtype-modal');
const subtypeModalTitle = document.getElementById('subtype-modal-title');
const subtypeModalList = document.getElementById('subtype-modal-list');
const closeSubtypeModalBtn = document.getElementById('close-subtype-modal-btn');
const addSubtypeBtn = document.getElementById('add-subtype-btn');

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

// Ֆունկցիա՝ ենթատեսակների մոդալը ցուցադրելու համար
function showSubtypeModal(itemId, itemName, imageUrl, subtypes) {
    selectedItem = { id: itemId, name: itemName, image: imageUrl, subtypes: JSON.parse(subtypes) };
    subtypeModalTitle.innerHTML = `<img src="${imageUrl}" class="item-image mr-2 inline-block" alt="${itemName}"> Ընտրեք ${itemName}`;
    subtypeModalList.innerHTML = '';

    selectedItem.subtypes.forEach(subtype => {
        const subtypeDiv = document.createElement('div');
        subtypeDiv.className = 'subtype-item flex justify-between items-center mb-2 p-2 border rounded-md';
        subtypeDiv.innerHTML = `
            <div class="flex items-center">
                <img src="${imageUrl}" class="item-image mr-2" alt="${subtype.name}">
                <span class="text-gray-600">${subtype.name}</span>
            </div>
            <div class="flex items-center">
                <input type="radio" name="subtype" value="${subtype.name}" data-price="${subtype.price}" class="mr-2">
                <span class="text-gray-600">$${subtype.price.toFixed(2)}</span>
            </div>
        `;
        subtypeModalList.appendChild(subtypeDiv);
    });

    subtypeModal.classList.remove('hidden');
}

// Իրադարձությունների լսիչ՝ ընտրել կոճակի համար
menuItems.addEventListener('click', (event) => {
    const button = event.target.closest('.select-btn');
    if (button) {
        const card = button.closest('.item-card');
        const id = card.dataset.id;
        const name = card.dataset.name;
        const image = card.dataset.image;
        const subtypes = card.dataset.subtypes;
        showSubtypeModal(id, name, image, subtypes);
    }
});

// Իրադարձությունների լսիչ՝ ենթատեսակ ավելացնելու համար
addSubtypeBtn.addEventListener('click', () => {
    const selectedSubtype = subtypeModalList.querySelector('input[name="subtype"]:checked');
    if (!selectedSubtype) {
        showMessageBox('Խնդրում ենք ընտրել ենթատեսակ։');
        return;
    }

    const subtype = selectedSubtype.value;
    const price = parseFloat(selectedSubtype.dataset.price);
    const uniqueId = `${selectedItem.id}_${subtype}`;
    const name = `${selectedItem.name} (${subtype})`;

    if (cart[uniqueId]) {
        cart[uniqueId].quantity++;
    } else {
        cart[uniqueId] = { name, price, quantity: 1, subtype };
    }
    saveCartToStorage();
    updateCartDisplay(cart);
    showMessageBox(`${name} ավելացվեց զամբյուղում։`);
    subtypeModal.classList.add('hidden');
});

// Իրադարձությունների լսիչ՝ ենթատեսակի մոդալը փակելու համար
closeSubtypeModalBtn.addEventListener('click', () => {
    subtypeModal.classList.add('hidden');
});

// Իրադարձությունների լսիչ՝ զամբյուղում քանակը կառավարելու համար
menuItems.addEventListener('click', (event) => {
    const button = event.target.closest('.quantity-control button');
    if (button) {
        const card = button.closest('.item-card');
        const id = card.dataset.id;
        const subtypes = JSON.parse(card.dataset.subtypes);
        const subtype = subtypes[0].name; // Օգտագործում ենք առաջին ենթատեսակը որպես լռելյայն
        const uniqueId = `${id}_${subtype}`;
        const action = button.dataset.action;
        handleCartQuantityChange(uniqueId, action);
    }
});

// Ֆունկցիա՝ զամբյուղի քանակը փոփոխելու համար
function handleCartQuantityChange(uniqueId, action) {
    if (cart[uniqueId]) {
        if (action === 'increase') {
            cart[uniqueId].quantity++;
            showMessageBox(`${cart[uniqueId].name} քանակը ավելացավ։`);
        } else if (action === 'decrease') {
            cart[uniqueId].quantity--;
            if (cart[uniqueId].quantity <= 0) {
                showMessageBox(`${cart[uniqueId].name} հեռացվեց զամբյուղից։`);
                delete cart[uniqueId];
            }
        }
        saveCartToStorage();
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
                saveCartToStorage();
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