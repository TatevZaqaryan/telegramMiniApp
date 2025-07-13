// ui.js - Օգտատիրոջ ինտերֆեյսի (UI) հետ կապված ֆունկցիաներ

// Ստանում ենք անհրաժեշտ DOM էլեմենտները
const messageBox = document.getElementById('message-box');
const confirmationModal = document.getElementById('confirmation-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const okModalBtn = document.getElementById('ok-modal-btn');
const viewOrderBtn = document.getElementById('view-order-btn'); // Նոր VIEW ORDER կոճակ

// Ֆունկցիա՝ հաղորդագրություն ցուցադրելու համար (օգտագործում է Telegram.WebApp.showAlert, եթե հասանելի է)
function showMessageBox(message, duration = 2000) {
    const TelegramWebApp = window.Telegram.WebApp; // Ստանում ենք TelegramWebApp օբյեկտը
    if (TelegramWebApp && TelegramWebApp.showAlert) {
        try {
            TelegramWebApp.showAlert(message);
        } catch (e) {
            // Եթե showAlert-ը չի աջակցվում կամ սխալ է առաջանում, օգտագործում ենք տեղական հաղորդագրության արկղը
            console.warn("Telegram WebApp.showAlert failed, falling back to local message box:", e);
            messageBox.textContent = message;
            messageBox.style.display = 'block';
            setTimeout(() => {
                messageBox.style.display = 'none';
            }, duration);
        }
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
    let totalItemsInCart = 0;
    let totalCartPrice = 0;

    // Ցիկլով անցնում ենք բոլոր ապրանքների քարտերի վրայով
    document.querySelectorAll('.item-card').forEach(card => {
        const itemId = card.dataset.id;
        const addBtn = card.querySelector('.add-btn');
        const quantityControl = card.querySelector('.quantity-control');
        const quantityDisplay = card.querySelector('.quantity-display');

        if (cart[itemId] && cart[itemId].quantity > 0) {
            // Եթե ապրանքը զամբյուղում է, ցուցադրում ենք քանակի կառավարումը
            addBtn.classList.add('hidden');
            quantityControl.classList.remove('hidden');
            quantityDisplay.textContent = cart[itemId].quantity;
            totalItemsInCart += cart[itemId].quantity;
            totalCartPrice += cart[itemId].price * cart[itemId].quantity;
        } else {
            // Եթե ապրանքը զամբյուղում չէ, ցուցադրում ենք "ADD" կոճակը
            addBtn.classList.remove('hidden');
            quantityControl.classList.add('hidden');
            quantityDisplay.textContent = '0'; // Reset quantity display
        }
    });

    // Թարմացնում ենք VIEW ORDER կոճակի վիճակը
    if (totalItemsInCart > 0) {
        viewOrderBtn.disabled = false;
        viewOrderBtn.textContent = `VIEW ORDER (${totalItemsInCart} items - $${totalCartPrice.toFixed(2)})`;
    } else {
        viewOrderBtn.disabled = true;
        viewOrderBtn.textContent = 'VIEW ORDER';
    }

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

// Մոդալի փակման կոճակների իրադարձությունների լսիչներ
closeModalBtn.addEventListener('click', hideConfirmationModal);
okModalBtn.addEventListener('click', hideConfirmationModal);

// Էքսպորտ ենք անում ֆունկցիաները, որպեսզի դրանք հասանելի լինեն main.js-ում
// Այս դեպքում, քանի որ ui.js-ը ներառվում է main.js-ից առաջ, դրանք հասանելի կլինեն։
