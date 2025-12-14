const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Конфігурація пошти
const createTransporter = () => {
    // ЗМІНІТЬ ЦІ НАЛАШТУВАННЯ НА СВОЇ!
    return nodemailer.createTransport({
        service: 'gmail', // Можна використовувати: gmail, outlook, yahoo
        auth: {
            user: 'your-email@gmail.com', // ВАША пошта
            pass: 'your-app-password' // Пароль додатка (не звичайний пароль!)
        }
    });
};

// Ендпоінт для відправки листа
app.post('/send-email', async (req, res) => {
    try {
        const { name, email, phone, department, subject, message } = req.body;
        
        // Валідація обов'язкових полів
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Будь ласка, заповніть обов\'язкові поля' 
            });
        }
        
        // Створюємо транспорт
        const transporter = createTransporter();
        
        // Налаштування листа
        const mailOptions = {
            from: '"Форма зворотного зв\'язку ЦДУ" <your-email@gmail.com>',
            to: 'your-email@gmail.com', // КУДИ НАДСИЛАТИ (можна змінити)
            subject: `[Форма ЦДУ] ${subject}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2C3E50;">Нове повідомлення з форми зворотного зв'язку</h2>
                    <div style="background: #f5f5f5; padding: 20px; border-radius: 5px;">
                        <p><strong>📌 Тема:</strong> ${subject}</p>
                        <p><strong>👤 Відправник:</strong> ${name}</p>
                        <p><strong>📧 Email:</strong> ${email}</p>
                        ${phone ? `<p><strong>📞 Телефон:</strong> ${phone}</p>` : ''}
                        ${department ? `<p><strong>🏢 Відділ:</strong> ${department}</p>` : ''}
                        <p><strong>📝 Повідомлення:</strong></p>
                        <div style="background: white; padding: 15px; border-left: 4px solid #3498DB;">
                            ${message.replace(/\n/g, '<br>')}
                        </div>
                        <hr>
                        <p style="color: #7F8C8D; font-size: 12px;">
                            Надіслано: ${new Date().toLocaleString('uk-UA')}
                        </p>
                    </div>
                </div>
            `,
            text: `
                Нове повідомлення з форми зворотного зв'язку ЦДУ
                
                Тема: ${subject}
                Відправник: ${name}
                Email: ${email}
                ${phone ? `Телефон: ${phone}` : ''}
                ${department ? `Відділ: ${department}` : ''}
                
                Повідомлення:
                ${message}
                
                Надіслано: ${new Date().toLocaleString('uk-UA')}
            `
        };
        
        // Відправляємо лист
        const info = await transporter.sendMail(mailOptions);
        
        // Лист підтвердження користувачу
        const userMailOptions = {
            from: '"ЦДУ імені В.Винниченка" <your-email@gmail.com>',
            to: email,
            subject: 'Дякуємо за ваше повідомлення!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2C3E50;">Дякуємо за звернення!</h2>
                    <p>Шановний/а ${name},</p>
                    <p>Ми отримали ваше повідомлення на тему <strong>"${subject}"</strong>.</p>
                    <p>Наші співробітники розглянуть ваш запит та відповідь вам найближчим часом.</p>
                    
                    <div style="background: #ECF0F1; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>📋 Ваше повідомлення:</strong></p>
                        <p style="margin: 10px 0 0 0;">${message.substring(0, 200)}${message.length > 200 ? '...' : ''}</p>
                    </div>
                    
                    <p>З повагою,<br>
                    <strong>Центральноукраїнський державний університет імені Володимира Винниченка</strong></p>
                    
                    <hr style="margin: 20px 0;">
                    <p style="color: #7F8C8D; font-size: 12px;">
                        Це автоматичне повідомлення. Будь ласка, не відповідайте на нього.<br>
                        Адреса: вул. Університетська, 1, м. Кропивницький<br>
                        Телефон: (0522) 55-12-30
                    </p>
                </div>
            `
        };
        
        await transporter.sendMail(userMailOptions);
        
        res.json({ 
            success: true, 
            message: 'Повідомлення успішно відправлено!',
            messageId: info.messageId
        });
        
    } catch (error) {
        console.error('Помилка відправки:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Сталася помилка при відправці повідомлення',
            error: error.message 
        });
    }
});

// Службовий ендпоінт для перевірки
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'CDU Contact Form API',
        timestamp: new Date().toISOString()
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`✅ Сервер запущено на порту ${PORT}`);
    console.log(`🔗 Додайте цей скрипт у ваш HTML файл для відправки форми:`);
    console.log(`
    <script>
        document.querySelector('.contact-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                department: document.getElementById('department').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value
            };
            
            try {
                const response = await fetch('http://localhost:3000/send-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('✅ Повідомлення успішно відправлено!');
                    document.querySelector('.contact-form').reset();
                } else {
                    alert('❌ Помилка: ' + result.message);
                }
            } catch (error) {
                alert('❌ Помилка з\'єднання з сервером');
            }
        });
    </script>
    `);
});