const admin = require('firebase-admin');

const serviceAccount = {
  "type": "service_account",
  "project_id": "fusion81-77505965-97563",
  "private_key_id": "e93a87cbf78b65604bfaa42f2861b8efaedf42fc",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEuwIBADANBgkqhkiG9w0BAQEFAASCBKUwggShAgEAAoIBAQDE9Dv5nhPYCN9M\nWCmGj6fbmb0XecPGFH+FZVqFFdd4BczJXRelJTeHeaJG8ECmBainFaLMitK7L/8q\nlDc4lmZqPLVx375jfRZyeNZ8g93hAle0d7rh3tc0ULfXhvgr8/Quc55JqhjC+ejl\nueYeplI/d007C8erD+4aRi03u1m2SqogTMKFI79+EIXk3Xrl0z12W2Ifht2oNnFj\nPn1np8jzf2fUpaQINS0RUJv576ylsX5WZd57qWFh3jco072EaYVK3LNWsJSo7TXB\n45gE+O1WVci3Es09aRrpoenwIqPm/hbXBtZMMVrCRxDvcrMe8O0V9WJStQ6rJcHB\npbw/H133AgMBAAECgf89SWYJn4nTzgktNYBn3+83ktHbrJ91aq8FVoKeAVpHrD/O\n2fyr8iE/O02yyWS7ZxeC4qWDod+YlG8ZBzp0W1a1lAI40e35zPjophhEio+9Ghm7\nr9bOJcIYRu2noIaXKst8Yl2ursiIyVeZa0OVL9eKaUKvKx2B0vg6i3uSt9IShDh/\nl1mvKvBJAdxuNB6l1Kg/7yZ462GwF0+uunX0S3tNhM1TM2S0AKR4GbB/2U4x2BWn\nzbPnkl9/jtw3NS0Z5TPRB1+wCNew24tgr93NLd+7aCS3cSGqpRmAlQ4FzawuYpXl\n8nVK0FOdB0lQvlnLqPXWZ2fVlLOzKCZ4SDFrqkkCgYEA8Kf+2+aA+YsDjbgM2XRX\nsEBWyxNP3uEnNuJAolGBcRELek+ZAYBdL3pxc42MK971Aw8oCCO5jwB6WH54d1Y2\nPLBUpPpRQ+baKC4bHGPAwvjXhOsJ3uaUY22WnOHfzS0VxIqx1uVuBdtUlDZCRLr/\nFS4j+Ay8FnfiyVkGYNfyeE0CgYEA0YLt2jidlVPPSgsnx9OEhBIiWjn3zMYSa297\nAQzWwNKPhsGkriz4YeWO91RXOaIsHFOe1w3GPav62FU32sjoF3QCeOqCGZekTPd4\nhcAe6u9hDzLPmYaj2NfH+UDlARV5Z6E8WE83fKxxLVpuTzRDRYr4qijKOwL0ZwxE\nAUo6UVMCgYEAiwNv+9Sl0gBUOCwF+CL1eFFiEYKBU6zZuyFs1pagYBDJgYizSKO+\nsGtZV7d/LeRnwbGinTkNuiY7hhzgN4csY1g0POx/vup+QFGJxZd1xOp7jEM8+25U\nby7hnpP3dIzDkznOyuTS7j0pGUhSdWNTcAesLWAl0hDEhyyOu6hiXs0CgYBPvfWp\nyUKxQ2TyWayacfdODVjl3opidkEsgxHeJHTYj0vxjmKPqK4hFK6FlKReW0tOvMUI\nNUXu0zZ2gHjx3OX5hz4pp5g9BWqToN1OiwE5ikL29e/uD0Dtl7OVOw3ui63Zs5S0\nR/JmkXvCN1kk7E9ueKaMnVnbfBRp5FE97HKl4QKBgC5o8+I7j4bCtI44lxTpbZ+Q\nsaEMrW3fCjA7Ng2ME/R6high/wEpMXbc92MBB2yvzbSdfNtnQUl+HGO2ybmj5iYz\niTEMGpzlNHdsGcf4T2ADofIc2PqZNO7M3wwZIG5amswWbjrSa173jkUYjqWPIx4k\n5nPIsqT5KHigPnhHpXdq\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@fusion81-77505965-97563.iam.gserviceaccount.com"
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function run() {
  try {
    const user = await admin.auth().getUserByEmail('ceo@fusion8.com');
    console.log('CEO User UID:', user.uid);
    await admin.firestore().collection('roles_admin').doc(user.uid).set({ role: 'admin' });
    console.log('Granted admin role to CEO');
    
    // While we're at it, approve the teacher!
    const teacher = await admin.auth().getUserByEmail('teacher1@fusion8.com');
    console.log('Teacher UID:', teacher.uid);
    await admin.firestore().collection('approved_teachers').doc(teacher.uid).set({ approvedAt: new Date() });
    await admin.firestore().collection('users').doc(teacher.uid).update({ approved: true }).catch(() => admin.firestore().collection('users').doc(teacher.uid).set({ approved: true, role: 'teacher' }));
    console.log('Approved teacher');
    
    console.log('All done!');
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
