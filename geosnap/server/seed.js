import bcrypt from 'bcryptjs';
import { UserDB, PhotoDB, CommentDB, initDB } from './database.js';

const seedDatabase = async () => {
  try {
    // Initialize database
    initDB();

    console.log('🌱 Starting database seed...');

    // Create multiple users
    const users = [
      { username: 'demo_user', email: 'demo@geosnap.com', password: 'demo123' },
      { username: 'nguyen_van_a', email: 'nguyenvana@gmail.com', password: 'password123' },
      { username: 'tran_thi_b', email: 'tranthib@gmail.com', password: 'password123' },
      { username: 'le_van_c', email: 'levanc@gmail.com', password: 'password123' },
      { username: 'pham_thi_d', email: 'phamthid@gmail.com', password: 'password123' },
      { username: 'hoang_van_e', email: 'hoangvane@gmail.com', password: 'password123' },
    ];

    const createdUsers = [];
    
    for (const userData of users) {
      let user = UserDB.findByEmail(userData.email);
      
      if (!user) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        user = UserDB.create({
          username: userData.username,
          email: userData.email,
          password: hashedPassword,
          avatar: null
        });
        console.log(`✅ Created user: ${userData.email} / ${userData.password}`);
      } else {
        console.log(`ℹ️  User ${userData.email} already exists`);
      }
      createdUsers.push(user);
    }

    // Check if photos exist
    const existingPhotos = PhotoDB.findAll();
    
    if (existingPhotos.length === 0) {
      // Create sample photos around Ho Chi Minh City with different users
      const samplePhotos = [
        {
          user_id: createdUsers[0].id,
          image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48cmVjdCBmaWxsPSIjMWExYTJlIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiNmZmYiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn4+b77iPIEJlbiBUaGFuaCBNYXJrZXQ8L3RleHQ+PC9zdmc+',
          latitude: 10.7721,
          longitude: 106.6980,
          address: 'Chợ Bến Thành',
          rating: 5,
          caption: 'Khu chợ sầm uất nhất Sài Gòn! 🛒'
        },
        {
          user_id: createdUsers[1].id,
          image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48cmVjdCBmaWxsPSIjMTYyMTNlIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiNmZmYiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn4+X77iPIE5vdHJlIERhbWUgQ2F0aGVkcmFsPC90ZXh0Pjwvc3ZnPg==',
          latitude: 10.7798,
          longitude: 106.6990,
          address: 'Nhà thờ Đức Bà',
          rating: 5,
          caption: 'Kiến trúc tuyệt đẹp từ thời Pháp thuộc 🏛️'
        },
        {
          user_id: createdUsers[2].id,
          image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48cmVjdCBmaWxsPSIjMGYzNDYwIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiNmZmYiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn4+iIEJpdGV4Y28gVG93ZXI8L3RleHQ+PC9zdmc+',
          latitude: 10.7716,
          longitude: 106.7043,
          address: 'Bitexco Tower',
          rating: 4,
          caption: 'Tòa nhà biểu tượng của thành phố 🌆'
        },
        {
          user_id: createdUsers[3].id,
          image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48cmVjdCBmaWxsPSIjMWEzYzQwIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiNmZmYiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn4y0IEJ1aSBWaWVuIFN0cmVldDwvdGV4dD48L3N2Zz4=',
          latitude: 10.7678,
          longitude: 106.6932,
          address: 'Phố Tây Bùi Viện',
          rating: 4,
          caption: 'Cuộc sống về đêm sôi động! 🎉'
        },
        {
          user_id: createdUsers[4].id,
          image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48cmVjdCBmaWxsPSIjMjg0MDRkIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiNmZmYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn4+bIEluZGVwZW5kZW5jZSBQYWxhY2U8L3RleHQ+PC9zdmc+',
          latitude: 10.7770,
          longitude: 106.6953,
          address: 'Dinh Độc Lập',
          rating: 5,
          caption: 'Di tích lịch sử quan trọng của Việt Nam 🇻🇳'
        },
        {
          user_id: createdUsers[5].id,
          image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48cmVjdCBmaWxsPSIjMmQzNDM2IiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiNmZmYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn4yGIFBodSBNeSBIdW5nPC90ZXh0Pjwvc3ZnPg==',
          latitude: 10.7285,
          longitude: 106.7187,
          address: 'Phú Mỹ Hưng',
          rating: 4,
          caption: 'Khu đô thị hiện đại và xanh 🌳'
        }
      ];

      const photos = [];
      for (const photoData of samplePhotos) {
        const photo = PhotoDB.create(photoData);
        photos.push(photo);
      }
      console.log(`✅ Created ${photos.length} sample photos`);

      // Create sample comments from different users
      const sampleComments = [
        { photo_id: photos[0].id, user_id: createdUsers[1].id, text: 'Nơi đây có đồ ăn ngon lắm! 😋' },
        { photo_id: photos[0].id, user_id: createdUsers[2].id, text: 'Nhớ mua quà về cho mọi người nha!' },
        { photo_id: photos[0].id, user_id: createdUsers[3].id, text: 'Chợ Bến Thành luôn đông vui 🎊' },
        { photo_id: photos[1].id, user_id: createdUsers[0].id, text: 'Kiến trúc Gothic quá đẹp ❤️' },
        { photo_id: photos[1].id, user_id: createdUsers[4].id, text: 'Nên đi vào buổi sáng sớm!' },
        { photo_id: photos[2].id, user_id: createdUsers[1].id, text: 'View từ tầng cao tuyệt vời!' },
        { photo_id: photos[2].id, user_id: createdUsers[5].id, text: 'Cafe trên tầng thượng ngon lắm ☕' },
        { photo_id: photos[3].id, user_id: createdUsers[2].id, text: 'Phố đi bộ vui quá!' },
        { photo_id: photos[3].id, user_id: createdUsers[4].id, text: 'Đêm cuối tuần rất sôi động! 🎵' },
        { photo_id: photos[4].id, user_id: createdUsers[3].id, text: 'Nơi đây rất có ý nghĩa lịch sử' },
        { photo_id: photos[5].id, user_id: createdUsers[0].id, text: 'Khu vực yên tĩnh, sạch đẹp 🏡' },
      ];

      for (const commentData of sampleComments) {
        CommentDB.create(commentData);
      }
      console.log(`✅ Created ${sampleComments.length} sample comments`);

      // Add some likes
      const photoIds = photos.map(p => p.id);
      PhotoDB.toggleLike(photoIds[0], createdUsers[1].id);
      PhotoDB.toggleLike(photoIds[0], createdUsers[2].id);
      PhotoDB.toggleLike(photoIds[0], createdUsers[3].id);
      PhotoDB.toggleLike(photoIds[1], createdUsers[0].id);
      PhotoDB.toggleLike(photoIds[1], createdUsers[4].id);
      PhotoDB.toggleLike(photoIds[2], createdUsers[1].id);
      PhotoDB.toggleLike(photoIds[3], createdUsers[2].id);
      PhotoDB.toggleLike(photoIds[3], createdUsers[5].id);
      PhotoDB.toggleLike(photoIds[4], createdUsers[3].id);
      PhotoDB.toggleLike(photoIds[5], createdUsers[4].id);
      console.log(`✅ Added sample likes`);

    } else {
      console.log(`ℹ️  ${existingPhotos.length} photos already exist`);
    }

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('Available accounts:');
    console.log('┌─────────────────────────────────────────────────────┐');
    console.log('│  Email                    │  Password              │');
    console.log('├─────────────────────────────────────────────────────┤');
    for (const user of users) {
      console.log(`│  ${user.email.padEnd(24)} │  ${user.password.padEnd(20)} │`);
    }
    console.log('└─────────────────────────────────────────────────────┘\n');

  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();
