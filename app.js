// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-analytics.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { 
    getDatabase, 
    ref, 
    set, 
    push, 
    onValue, 
    serverTimestamp,
    update,
    remove,
    query,
    orderByChild,
    equalTo
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { 
    getStorage, 
    ref as storageRef, 
    uploadBytesResumable,
    getDownloadURL 
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAzYZMxqNmnLMGYnCyiJYPg2MbxZMt0co0",
    authDomain: "osama-91b95.firebaseapp.com",
    databaseURL: "https://osama-91b95-default-rtdb.firebaseio.com",
    projectId: "osama-91b95",
    storageBucket: "osama-91b95.appspot.com",
    messagingSenderId: "118875905722",
    appId: "1:118875905722:web:200bff1bd99db2c1caac83",
    measurementId: "G-LEM5PVPJZC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

// عناصر DOM
const homePage = document.getElementById('home-page');
const authPage = document.getElementById('auth-page');
const addPostPage = document.getElementById('add-post-page');
const profilePage = document.getElementById('profile-page');
const messagesPage = document.getElementById('messages-page');
const postDetailPage = document.getElementById('post-detail-page');
const loadingOverlay = document.getElementById('loading-overlay');
const uploadProgress = document.getElementById('upload-progress');

const authMessage = document.getElementById('auth-message');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');
const publishBtn = document.getElementById('publish-btn');
const buyNowBtn = document.getElementById('buy-now-btn');

const postsContainer = document.getElementById('posts-container');
const userInfo = document.getElementById('user-info');
const postDetailContent = document.getElementById('post-detail-content');

const profileIcon = document.getElementById('profile-icon');
const messagesIcon = document.getElementById('messages-icon');
const addPostIcon = document.getElementById('add-post-icon');
const supportIcon = document.getElementById('support-icon');
const moreIcon = document.getElementById('more-icon');
const homeIcon = document.getElementById('home-icon');
const closeAuthBtn = document.getElementById('close-auth');
const closeAddPostBtn = document.getElementById('close-add-post');
const closeProfileBtn = document.getElementById('close-profile');
const closeMessagesBtn = document.getElementById('close-messages');
const closePostDetailBtn = document.getElementById('close-post-detail');

// عناصر رفع الصورة
const postImageInput = document.getElementById('post-image');
const chooseImageBtn = document.getElementById('choose-image-btn');
const cameraBtn = document.getElementById('camera-btn');
const imageName = document.getElementById('image-name');
const imagePreview = document.getElementById('image-preview');
const previewImg = document.getElementById('preview-img');
const removeImageBtn = document.getElementById('remove-image-btn');

// عناصر نظام الرسائل
const usersList = document.getElementById('users-list');
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const sendMessageBtn = document.getElementById('send-message-btn');
const currentChatUser = document.getElementById('current-chat-user');

// متغيرات نظام الرسائل
let activeUserId = null;
let userMessages = {};
let userUnreadCounts = {};
let userLastMessageTime = {};
let currentUserData = null;
let messagesListener = null;
let currentPost = null;
let adminUsers = [];

// تحميل المنشورات عند بدء التحميل
document.addEventListener('DOMContentLoaded', () => {
    loadPosts();
    loadAdminUsers();
});

// استمع لتغير حالة المستخدم
onAuthStateChanged(auth, user => {
    if (user) {
        // تحميل بيانات المستخدم الحالي
        const userRef = ref(database, 'users/' + user.uid);
        onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
                currentUserData = snapshot.val();
                currentUserData.uid = user.uid;
            }
        }, { onlyOnce: true });
    } else {
        currentUserData = null;
    }
});

// تحميل المشرفين
function loadAdminUsers() {
    const usersRef = ref(database, 'users');
    onValue(usersRef, (snapshot) => {
        adminUsers = [];
        
        if (snapshot.exists()) {
            const users = snapshot.val();
            
            // البحث عن المشرفين فقط
            Object.keys(users).forEach(userId => {
                if (users[userId].isAdmin) {
                    adminUsers.push({
                        id: userId,
                        ...users[userId]
                    });
                }
            });
        }
    });
}

// تحميل المنشورات للجميع
function loadPosts() {
    const postsRef = ref(database, 'posts');
    onValue(postsRef, (snapshot) => {
        postsContainer.innerHTML = '';
        
        if (snapshot.exists()) {
            const posts = snapshot.val();
            Object.keys(posts).reverse().forEach(postId => {
                const post = {
                    id: postId,
                    ...posts[postId]
                };
                createPostCard(post);
            });
        } else {
            postsContainer.innerHTML = '<p class="no-posts">لا توجد منشورات بعد. كن أول من ينشر!</p>';
        }
    });
}

// إنشاء بطاقة منشور
function createPostCard(post) {
    const postCard = document.createElement('div');
    postCard.className = 'post-card';
    
    // إذا كان هناك صورة، نعرضها. وإلا نعرض أيقونة افتراضية.
    const imageContent = post.imageUrl 
        ? `<div class="post-image"><img src="${post.imageUrl}" alt="${post.title}"></div>`
        : `<div class="post-image"><i class="fas fa-image fa-3x"></i></div>`;
    
    postCard.innerHTML = `
        ${imageContent}
        <div class="post-content">
            <h3 class="post-title">${post.title}</h3>
            <p class="post-description">${post.description}</p>
            <div class="post-meta">
                ${post.price ? `<div class="post-price">${post.price}</div>` : ''}
                <div class="post-location"><i class="fas fa-map-marker-alt"></i> ${post.location}</div>
            </div>
            <div class="post-author">
                <i class="fas fa-user"></i> ${post.authorName}
                <span class="post-phone">${post.phone}</span>
            </div>
        </div>
    `;
    
    // إضافة حدث النقر لعرض التفاصيل
    postCard.addEventListener('click', () => {
        showPostDetail(post);
    });
    
    postsContainer.appendChild(postCard);
}

// عرض تفاصيل المنشور
function showPostDetail(post) {
    currentPost = post;
    
    // إنشاء محتوى تفاصيل المنشور
    postDetailContent.innerHTML = `
        ${post.imageUrl ? 
            `<img src="${post.imageUrl}" alt="${post.title}" class="post-detail-image">` : 
            `<div class="post-detail-image" style="display: flex; align-items: center; justify-content: center; background: var(--light-gray);">
                <i class="fas fa-image fa-3x" style="color: var(--gray-color);"></i>
            </div>`
        }
        
        <h2 class="post-detail-title">${post.title}</h2>
        
        <p class="post-detail-description">${post.description}</p>
        
        <div class="post-detail-meta">
            ${post.price ? `
                <div class="meta-item">
                    <i class="fas fa-tag"></i>
                    <span>السعر: ${post.price}</span>
                </div>
            ` : ''}
            
            <div class="meta-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>الموقع: ${post.location}</span>
            </div>
            
            <div class="meta-item">
                <i class="fas fa-phone"></i>
                <span>رقم الهاتف: ${post.phone}</span>
            </div>
        </div>
        
        <div class="post-detail-author">
            <div class="author-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="author-info">
                <div class="author-name">${post.authorName}</div>
                <div class="author-contact">${post.authorPhone}</div>
            </div>
        </div>
    `;
    
    showPage(postDetailPage);
}

// زر اشتري الآن
buyNowBtn.addEventListener('click', () => {
    const user = auth.currentUser;
    
    if (!user) {
        showAuthMessage('يجب تسجيل الدخول أولاً', 'error');
        showPage(authPage);
        return;
    }
    
    if (adminUsers.length === 0) {
        alert('لا توجد إدارة متاحة حالياً');
        return;
    }
    
    // فتح محادثة مع أول مشرف متاح
    openChat(adminUsers[0]);
    showPage(messagesPage);
    
    // إرسال رسالة تلقائية عن المنتج
    const productMessage = `أريد شراء المنتج: ${currentPost.title} - السعر: ${currentPost.price || 'غير محدد'}`;
    messageInput.value = productMessage;
});

// تسجيل الدخول
loginBtn.addEventListener('click', e => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showAuthMessage('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            showAuthMessage('تم تسجيل الدخول بنجاح!', 'success');
            setTimeout(() => {
                showPage(homePage);
                resetAuthForms();
            }, 1500);
        })
        .catch(error => {
            showAuthMessage(getAuthErrorMessage(error.code), 'error');
        });
});

// إنشاء حساب
signupBtn.addEventListener('click', e => {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const phone = document.getElementById('signup-phone').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const address = document.getElementById('signup-address').value;
    
    if (!name || !phone || !email || !password || !address) {
        showAuthMessage('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    createUserWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
            const user = userCredential.user;
            
            // حفظ معلومات المستخدم الإضافية
            return set(ref(database, 'users/' + user.uid), {
                name: name,
                phone: phone,
                email: email,
                address: address,
                isAdmin: false,
                createdAt: serverTimestamp()
            });
        })
        .then(() => {
            showAuthMessage('تم إنشاء الحساب بنجاح!', 'success');
            setTimeout(() => {
                showPage(homePage);
                resetAuthForms();
            }, 1500);
        })
        .catch(error => {
            showAuthMessage(getAuthErrorMessage(error.code), 'error');
        });
});

// تسجيل الخروج
logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        showPage(homePage);
        // إزالة مستمع الرسائل عند تسجيل الخروج
        if (messagesListener) {
            messagesListener();
            messagesListener = null;
        }
    });
});

// نشر منشور جديد
publishBtn.addEventListener('click', async e => {
    e.preventDefault();
    
    const user = auth.currentUser;
    if (!user) {
        showPage(authPage);
        return;
    }
    
    const title = document.getElementById('post-title').value;
    const description = document.getElementById('post-description').value;
    const price = document.getElementById('post-price').value;
    const location = document.getElementById('post-location').value;
    const phone = document.getElementById('post-phone').value;
    const imageFile = postImageInput.files[0];
    
    if (!title || !description || !location || !phone) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
    }
    
    try {
        // إظهار شاشة التحميل
        loadingOverlay.classList.remove('hidden');
        uploadProgress.style.width = '0%';
        
        let imageUrl = null;
        if (imageFile) {
            // استخدام uploadBytesResumable لتتبع التقدم
            const fileRef = storageRef(storage, 'post_images/' + Date.now() + '_' + imageFile.name);
            const uploadTask = uploadBytesResumable(fileRef, imageFile);
            
            // انتظار اكتمال الرفع مع تحديث شريط التقدم
            await new Promise((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        // تحديث شريط التقدم
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        uploadProgress.style.width = progress + '%';
                    },
                    (error) => {
                        reject(error);
                    },
                    () => {
                        // الرفع اكتمل بنجاح
                        resolve();
                    }
                );
            });
            
            // الحصول على رابط التحميل بعد اكتمال الرفع
            imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
        }
        
        // الحصول على بيانات المستخدم
        const userRef = ref(database, 'users/' + user.uid);
        const userSnapshot = await new Promise((resolve) => {
            onValue(userRef, (snapshot) => resolve(snapshot), { onlyOnce: true });
        });
        
        if (!userSnapshot.exists()) {
            throw new Error('بيانات المستخدم غير موجودة');
        }
        
        const userData = userSnapshot.val();
        
        // إنشاء كائن المنشور
        const postData = {
            title: title,
            description: description,
            price: price || '',
            location: location,
            phone: phone,
            authorId: user.uid,
            authorName: userData.name,
            authorPhone: userData.phone,
            timestamp: serverTimestamp(),
            imageUrl: imageUrl || ''
        };
        
        // حفظ المنشور في قاعدة البيانات
        await push(ref(database, 'posts'), postData);
        
        // إخفاء شاشة التحميل وإظهار الرسالة
        loadingOverlay.classList.add('hidden');
        alert('تم نشر المنشور بنجاح!');
        resetAddPostForm();
        showPage(homePage);
    } 
    catch (error) {
        console.error('Error adding post: ', error);
        loadingOverlay.classList.add('hidden');
        alert('حدث خطأ أثناء نشر المنشور: ' + error.message);
    }
});

// عرض معلومات المستخدم
profileIcon.addEventListener('click', () => {
    const user = auth.currentUser;
    
    if (user) {
        // عرض صفحة حساب المستخدم
        const userRef = ref(database, 'users/' + user.uid);
        onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
                const userData = snapshot.val();
                userInfo.innerHTML = `
                    <div class="user-detail">
                        <i class="fas fa-user"></i>
                        <span>${userData.name}</span>
                    </div>
                    <div class="user-detail">
                        <i class="fas fa-envelope"></i>
                        <span>${userData.email}</span>
                    </div>
                    <div class="user-detail">
                        <i class="fas fa-phone"></i>
                        <span>${userData.phone}</span>
                    </div>
                    <div class="user-detail">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${userData.address}</span>
                    </div>
                `;
            } else {
                userInfo.innerHTML = '<p>لا توجد بيانات للمستخدم</p>';
            }
            showPage(profilePage);
        }, { onlyOnce: true });
    } else {
        // عرض صفحة التوثيق
        showPage(authPage);
    }
});

// إضافة منشور جديد
addPostIcon.addEventListener('click', () => {
    const user = auth.currentUser;
    
    if (user) {
        resetAddPostForm();
        showPage(addPostPage);
    } else {
        showPage(authPage);
    }
});

// فتح صفحة الرسائل
messagesIcon.addEventListener('click', () => {
    const user = auth.currentUser;
    
    if (user) {
        loadMessages();
        showPage(messagesPage);
    } else {
        showPage(authPage);
    }
});

// العودة للصفحة الرئيسية
homeIcon.addEventListener('click', () => {
    showPage(homePage);
});

// إغلاق صفحة التوثيق
closeAuthBtn.addEventListener('click', () => {
    showPage(homePage);
});

// إغلاق صفحة إضافة المنشور
closeAddPostBtn.addEventListener('click', () => {
    showPage(homePage);
});

// إغلاق صفحة الملف الشخصي
closeProfileBtn.addEventListener('click', () => {
    showPage(homePage);
});

// إغلاق صفحة الرسائل
closeMessagesBtn.addEventListener('click', () => {
    showPage(homePage);
    // إزالة مستمع الرسائل عند إغلاق الصفحة
    if (messagesListener) {
        messagesListener();
        messagesListener = null;
    }
});

// إغلاق صفحة تفاصيل المنشور
closePostDetailBtn.addEventListener('click', () => {
    showPage(homePage);
});

// تغيير علامات التوثيق
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        if (btn.dataset.tab === 'login') {
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
        } else {
            loginForm.classList.add('hidden');
            signupForm.classList.remove('hidden');
        }
    });
});

// اختيار صورة من المعرض
chooseImageBtn.addEventListener('click', () => {
    postImageInput.click();
});

// فتح الكاميرا (إذا كان الجهاز يدعمها)
cameraBtn.addEventListener('click', () => {
    postImageInput.setAttribute('capture', 'environment');
    postImageInput.click();
});

// عرض معاينة الصورة
postImageInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        const file = this.files[0];
        imageName.textContent = file.name;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            imagePreview.classList.remove('hidden');
        }
        reader.readAsDataURL(file);
    }
});

// إزالة الصورة المختارة
removeImageBtn.addEventListener('click', () => {
    postImageInput.value = '';
    imageName.textContent = 'لم يتم اختيار صورة';
    imagePreview.classList.add('hidden');
});

// تحميل الرسائل والمستخدمين
function loadMessages() {
    const user = auth.currentUser;
    if (!user) return;
    
    // التحقق من صلاحية المستخدم
    const userRef = ref(database, 'users/' + user.uid);
    onValue(userRef, (userSnapshot) => {
        if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            const isAdmin = userData.isAdmin || false;
            
            // إظهار رسالة تحميل
            usersList.innerHTML = '<p class="no-users">جاري تحميل المحادثات...</p>';
            
            // للمستخدمين العاديين، عرض الإدارة فقط
            loadAdminUsersForMessages(user.uid);
        }
    }, { onlyOnce: true });
}

// تحميل الإدارة فقط للمستخدم العادي
function loadAdminUsersForMessages(currentUserId) {
    usersList.innerHTML = '';
    
    if (adminUsers.length > 0) {
        // تحميل رسائل الإدارة
        loadUserMessages(adminUsers, currentUserId);
    } else {
        usersList.innerHTML = '<p class="no-users">لا توجد إدارة متاحة حالياً</p>';
    }
}

// تحميل رسائل المستخدمين
function loadUserMessages(users, currentUserId) {
    // إزالة المستمع السابق إذا كان موجوداً
    if (messagesListener) {
        messagesListener();
    }
    
    const messagesRef = ref(database, 'messages');
    messagesListener = onValue(messagesRef, (snapshot) => {
        userMessages = {};
        userUnreadCounts = {};
        
        if (snapshot.exists()) {
            const messages = snapshot.val();
            
            // تجميع الرسائل حسب المستخدم
            Object.keys(messages).forEach(messageId => {
                const message = messages[messageId];
                
                // تحديد المستخدم الآخر في المحادثة
                const otherUserId = message.senderId === currentUserId ? 
                    message.receiverId : message.senderId;
                
                if (!userMessages[otherUserId]) {
                    userMessages[otherUserId] = [];
                }
                
                userMessages[otherUserId].push({
                    id: messageId,
                    ...message
                });
                
                // حساب الرسائل غير المقروءة
                if (message.receiverId === currentUserId && !message.isRead) {
                    userUnreadCounts[otherUserId] = (userUnreadCounts[otherUserId] || 0) + 1;
                }
                
                // تحديث وقت آخر رسالة
                if (!userLastMessageTime[otherUserId] || message.timestamp > userLastMessageTime[otherUserId]) {
                    userLastMessageTime[otherUserId] = message.timestamp;
                }
            });
        }
        
        // عرض قائمة المستخدمين
        displayUsersList(users, currentUserId);
        
        // إذا كانت هناك محادثة نشطة، قم بتحديث الرسائل
        if (activeUserId) {
            displayMessages(activeUserId);
        }
    });
}

// عرض قائمة المستخدمين
function displayUsersList(users, currentUserId) {
    usersList.innerHTML = '';
    
    if (users.length === 0) {
        usersList.innerHTML = '<p class="no-users">لا يوجد مستخدمين آخرين</p>';
        return;
    }
    
    // ترتيب المستخدمين حسب آخر رسالة
    users.sort((a, b) => {
        const timeA = userLastMessageTime[a.id] || 0;
        const timeB = userLastMessageTime[b.id] || 0;
        return timeB - timeA;
    });
    
    users.forEach(userData => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.dataset.userId = userData.id;
        
        const lastMessage = userMessages[userData.id] ? 
            userMessages[userData.id][userMessages[userData.id].length - 1] : null;
        
        const lastMessageText = lastMessage ? 
            (lastMessage.content.length > 30 ? 
                lastMessage.content.substring(0, 30) + '...' : 
                lastMessage.content) : 
            'لا توجد رسائل';
        
        const unreadCount = userUnreadCounts[userData.id] || 0;
        
        userItem.innerHTML = `
            <div class="user-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="user-info">
                <div class="user-name">${userData.name}</div>
                <div class="user-status">${lastMessageText}</div>
            </div>
            ${unreadCount > 0 ? `<div class="unread-badge">${unreadCount}</div>` : ''}
        `;
        
        userItem.addEventListener('click', () => {
            openChat(userData);
        });
        
        usersList.appendChild(userItem);
    });
}

// فتح محادثة مع مستخدم
function openChat(userData) {
    activeUserId = userData.id;
    
    // التحقق من صلاحية المستخدم الحالي
    const user = auth.currentUser;
    if (user && currentUserData) {
        // عرض مؤشر الصلاحية
        displayAdminIndicator(currentUserData.isAdmin || false);
    }
    
    // تحديث واجهة المحادثة
    currentChatUser.textContent = userData.name;
    
    // تفعيل مربع الكتابة
    messageInput.disabled = false;
    sendMessageBtn.disabled = false;
    
    // عرض الرسائل
    displayMessages(userData.id);
    
    // وضع علامة على الرسائل كمقروءة
    markMessagesAsRead(userData.id);
    
    // إزالة التحديد من جميع المستخدمين وإضافته للمستخدم الحالي
    document.querySelectorAll('.user-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeUserItem = document.querySelector(`.user-item[data-user-id="${userData.id}"]`);
    if (activeUserItem) {
        activeUserItem.classList.add('active');
    }
}

// عرض الرسائل في المحادثة
function displayMessages(userId) {
    messagesContainer.innerHTML = '';
    
    if (!userMessages[userId] || userMessages[userId].length === 0) {
        messagesContainer.innerHTML = '<div class="no-chat-selected"><p>لا توجد رسائل بعد</p></div>';
        return;
    }
    
    // ترتيب الرسائل حسب الوقت
    const sortedMessages = userMessages[userId].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    
    sortedMessages.forEach(message => {
        addMessageToChat(message, userId);
    });
    
    // التمرير إلى أحدث رسالة
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// إضافة رسالة إلى الدردشة
function addMessageToChat(message, userId) {
    const messageElement = document.createElement('div');
    
    // تحديد إذا كانت الرسالة مرسلة أو مستلمة
    const isSent = message.senderId === (currentUserData ? currentUserData.uid : null);
    messageElement.className = `message ${isSent ? 'sent' : 'received'}`;
    
    const date = message.timestamp ? new Date(message.timestamp) : new Date();
    const timeString = date.toLocaleTimeString('ar-EG', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageElement.innerHTML = `
        <div class="message-content">${message.content}</div>
        <div class="message-time">${timeString}</div>
    `;
    
    messagesContainer.appendChild(messageElement);
}

// وضع علامة على الرسائل كمقروءة
function markMessagesAsRead(userId) {
    const user = auth.currentUser;
    if (!user) return;
    
    if (userMessages[userId]) {
        userMessages[userId].forEach(message => {
            if (message.receiverId === user.uid && !message.isRead) {
                update(ref(database, 'messages/' + message.id), {
                    isRead: true
                }).then(() => {
                    // تحديث العداد بعد وضع علامة مقروء
                    userUnreadCounts[userId] = (userUnreadCounts[userId] || 1) - 1;
                    if (userUnreadCounts[userId] <= 0) {
                        userUnreadCounts[userId] = 0;
                        const badge = document.querySelector(`.user-item[data-user-id="${userId}"] .unread-badge`);
                        if (badge) {
                            badge.remove();
                        }
                    }
                });
            }
        });
    }
}

// إرسال رسالة مع التحقق من الصلاحية
sendMessageBtn.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (!message || !activeUserId) return;
    
    const user = auth.currentUser;
    if (!user) return;
    
    // التحقق من أن المستخدم يرسل للإدارة فقط
    const isReceivingAdmin = adminUsers.some(admin => admin.id === activeUserId);
    if (!isReceivingAdmin) {
        alert('يمكنك التواصل مع الإدارة فقط');
        return;
    }
    
    sendMessageToUser(message, user, activeUserId);
});

// دالة منفصلة لإرسال الرسالة
function sendMessageToUser(message, user, receiverId) {
    const newMessage = {
        senderId: user.uid,
        receiverId: receiverId,
        content: message,
        timestamp: serverTimestamp(),
        isRead: false
    };
    
    push(ref(database, 'messages'), newMessage)
        .then(() => {
            messageInput.value = '';
            
            // إضافة الرسالة فوراً إلى الواجهة
            if (activeUserId === receiverId) {
                addMessageToChat({
                    ...newMessage,
                    timestamp: Date.now()
                }, receiverId);
                
                // التمرير إلى الأسفل لعرض الرسالة الجديدة
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
            
            // تحديث وقت آخر رسالة
            userLastMessageTime[receiverId] = Date.now();
            sortUsersList();
        })
        .catch(error => {
            alert('حدث خطأ أثناء إرسال الرسالة: ' + error.message);
        });
}

// ترتيب قائمة المستخدمين
function sortUsersList() {
    const userItems = Array.from(usersList.querySelectorAll('.user-item'));
    
    userItems.sort((a, b) => {
        const userIdA = a.dataset.userId;
        const userIdB = b.dataset.userId;
        const timeA = userLastMessageTime[userIdA] || 0;
        const timeB = userLastMessageTime[userIdB] || 0;
        return timeB - timeA;
    });
    
    // إعادة إضافة العناصر بالترتيب الجديد
    userItems.forEach(item => {
        usersList.appendChild(item);
    });
}

// عرض مؤشر الصلاحية في واجهة الرسائل
function displayAdminIndicator(isAdmin) {
    const chatHeader = document.getElementById('chat-header');
    
    if (isAdmin) {
        if (!document.getElementById('admin-badge')) {
            const adminBadge = document.createElement('span');
            adminBadge.id = 'admin-badge';
            adminBadge.className = 'admin-badge';
            adminBadge.innerHTML = '<i class="fas fa-crown"></i> مشرف';
            adminBadge.style.marginRight = '10px';
            adminBadge.style.background = 'var(--warning-color)';
            adminBadge.style.color = 'white';
            adminBadge.style.padding = '5px 10px';
            adminBadge.style.borderRadius = '15px';
            adminBadge.style.fontSize = '0.8rem';
            
            chatHeader.insertBefore(adminBadge, currentChatUser);
        }
    } else {
        const adminBadge = document.getElementById('admin-badge');
        if (adminBadge) {
            adminBadge.remove();
        }
    }
}

// وظائف مساعدة
function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    page.classList.remove('hidden');
}

function showAuthMessage(message, type) {
    authMessage.textContent = message;
    authMessage.className = '';
    authMessage.classList.add(type + '-message');
}

function getAuthErrorMessage(code) {
    switch(code) {
        case 'auth/invalid-email':
            return 'البريد الإلكتروني غير صالح';
        case 'auth/user-disabled':
            return 'هذا الحساب معطل';
        case 'auth/user-not-found':
            return 'لا يوجد حساب مرتبط بهذا البريد الإلكتروني';
        case 'auth/wrong-password':
            return 'كلمة المرور غير صحيحة';
        case 'auth/email-already-in-use':
            return 'هذا البريد الإلكتروني مستخدم بالفعل';
        case 'auth/weak-password':
            return 'كلمة المرور ضعيفة (يجب أن تحتوي على 6 أحرف على الأقل)';
        default:
            return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى';
    }
}

function resetAddPostForm() {
    document.getElementById('post-title').value = '';
    document.getElementById('post-description').value = '';
    document.getElementById('post-price').value = '';
    document.getElementById('post-location').value = '';
    document.getElementById('post-phone').value = '';
    postImageInput.value = '';
    imageName.textContent = 'لم يتم اختيار صورة';
    imagePreview.classList.add('hidden');
}

function resetAuthForms() {
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('signup-name').value = '';
    document.getElementById('signup-phone').value = '';
    document.getElementById('signup-email').value = '';
    document.getElementById('signup-password').value = '';
    document.getElementById('signup-address').value = '';
    authMessage.textContent = '';
    authMessage.className = '';
}