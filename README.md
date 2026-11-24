# ตัวติดตามงานออกแบบ UX/UI

เว็บแอพสำหรับติดตามงานออกแบบเว็บไซต์ทีละหน้า แต่ละหน้ามีเช็คลิสต์ที่กำหนดเอง ภาพ Wireframe / Lo-Fi / Mid-Fi / Hi-Fi
(หลายเวอร์ชัน) สถานะของแต่ละขั้น โน้ต ลิงก์ Figma ผู้รับผิดชอบ กำหนดส่ง และหน้าภาพรวมทั้งโปรเจกต์

เทคโนโลยี: React + Vite, Firebase (Authentication + Firestore), deploy ด้วย GitHub Pages

## ขั้นตอนตั้งค่า (ทำครั้งเดียว)

### 1) สร้างโปรเจกต์ Firebase
1. ไปที่ <https://console.firebase.google.com> > **Add project**
2. **Build > Authentication > Get started** แล้วเปิด Sign-in method: **Email/Password** และ/หรือ **Google**
3. **Build > Firestore Database > Create database** (เลือกโลเคชันใกล้ไทย เช่น `asia-southeast1`)
4. **Project settings > General > Your apps > Web (`</>`)** ลงทะเบียนแอพ แล้วคัดลอกค่า config

### 2) ใส่ค่า config
```bash
cp .env.example .env
# เปิด .env แล้วใส่ค่า VITE_FIREBASE_* จากขั้นตอนที่ 1
npm install
npm run dev
```
เปิด <http://localhost:5173> แล้วสร้างบัญชีของคุณในหน้าล็อกอิน

### 3) ติดตั้งกฎความปลอดภัยของ Firestore (สำคัญ)
ไฟล์ `firestore.rules` ทำให้ข้อมูลแต่ละบัญชีเข้าถึงได้เฉพาะเจ้าของ ติดตั้งโดย

- วิธีง่าย: คัดลอกเนื้อหาไฟล์ `firestore.rules` ไปวางที่ Firebase Console > Firestore Database > **Rules** > Publish
- หรือใช้ CLI: `npm i -g firebase-tools && firebase login && firebase use <project-id> && firebase deploy --only firestore:rules`

### 4) ปิดการสมัครบัญชีใหม่ (เพราะใช้คนเดียว)
หลังสร้างบัญชีของตัวเองแล้ว ไปที่ Authentication > **Settings > User actions** แล้วเอาติ๊ก **Enable create (sign-up)** ออก
คนอื่นจะสร้างบัญชีเพื่อใช้พื้นที่เก็บข้อมูลของคุณไม่ได้

## Deploy บน GitHub Pages
1. สร้าง repo บน GitHub แล้ว push โค้ดนี้ขึ้นสาขา `main`
2. **Settings > Pages > Build and deployment > Source = GitHub Actions**
3. **Settings > Secrets and variables > Actions > New repository secret** สร้าง 6 ตัวนี้ (ค่าจากขั้นตอนที่ 1):
   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
   `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`
4. ที่ Firebase Console > Authentication > **Settings > Authorized domains** เพิ่ม `<ชื่อผู้ใช้>.github.io`
5. push อีกครั้ง (หรือรัน workflow เอง) เว็บจะอยู่ที่ `https://<ชื่อผู้ใช้>.github.io/<ชื่อ-repo>/`

> ค่า config ของ Firebase ไม่ใช่ความลับ (อยู่ในโค้ดฝั่งเว็บอยู่แล้ว) ความปลอดภัยมาจากการล็อกอินและ `firestore.rules`

## การเก็บภาพ
| โหมด (`VITE_IMAGE_STORE`) | ลักษณะ | ค่าใช้จ่าย |
|---|---|---|
| `firestore` (ค่าเริ่มต้น) | ย่อภาพให้กว้างไม่เกิน 1600px แล้วเก็บเป็น JPEG ใน Firestore | ใช้แพ็กเกจ Spark ฟรีได้ ไม่ต้องผูกบัตร |
| `storage` | เก็บไฟล์ต้นฉบับใน Cloud Storage | ต้องอัปเกรดเป็น Blaze (ผูกบัตร) แต่ยังมีโควตาใช้ฟรี |

ถ้าจะเปลี่ยนเป็น `storage`: อัปเกรด Blaze > เปิด Storage > ติดตั้ง `storage.rules`
(`firebase deploy --only storage`) > ตั้ง `VITE_IMAGE_STORE=storage` (บน GitHub ตั้งเป็น Repository **variable**)
ภาพที่อัพโหลดไปแล้วในโหมดเดิมจะยังดูได้ แต่ภาพใหม่จะไปเก็บตามโหมดใหม่

## คำสั่ง
```bash
npm run dev      # รันบนเครื่อง
npm test         # ทดสอบตรรกะข้อมูลและการแสดงผล
npm run build    # สร้างไฟล์สำหรับ deploy ไว้ที่ dist/
```

## โครงสร้างข้อมูลใน Firestore
```
users/{uid}/projects/{projectId}            ชื่อโปรเจกต์
users/{uid}/projects/{projectId}/pages/{id} หน้าเว็บ (เช็คลิสต์ สถานะ เวอร์ชัน โน้ต ผู้รับผิดชอบ กำหนดส่ง ลิงก์ Figma)
users/{uid}/templates/{id}                  เทมเพลตเช็คลิสต์ที่บันทึกเอง
users/{uid}/images/{id}                     ภาพ (โหมด firestore)
```
