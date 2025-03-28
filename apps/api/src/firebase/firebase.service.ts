import { Injectable } from '@nestjs/common';
import { initializeApp } from 'firebase/app';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL,
  uploadString,
  UploadMetadata 
} from 'firebase/storage';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FirebaseService {
  private app;
  private storage;

  constructor(private configService: ConfigService) {
    const firebaseConfig = {
      apiKey: this.configService.get<string>('firebase.apiKey'),
      authDomain: this.configService.get<string>('firebase.authDomain'),
      projectId: this.configService.get<string>('firebase.projectId'),
      storageBucket: this.configService.get<string>('firebase.storageBucket'),
      messagingSenderId: this.configService.get<string>('firebase.messagingSenderId'),
      appId: this.configService.get<string>('firebase.appId'),
      measurementId: this.configService.get<string>('firebase.measurementId')
    };

    this.app = initializeApp(firebaseConfig);
    this.storage = getStorage(this.app);
  }

  async uploadFile(file: Express.Multer.File): Promise<{ secure_url: string, originalname: string, mimetype: string }> {
    try {
      // Create a storage reference
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.originalname}`;
      const filePath = `mindsmesh-attachments/${fileName}`;
      const storageRef = ref(this.storage, filePath);

      // Set metadata
      const metadata: UploadMetadata = {
        contentType: file.mimetype,
        customMetadata: {
          'originalname': file.originalname,
        },
      };

      // Upload the file
      const snapshot = await uploadBytes(storageRef, file.buffer, metadata);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        secure_url: downloadURL,
        originalname: file.originalname,
        mimetype: file.mimetype
      };
    } catch (error) {
      console.error('Error uploading file to Firebase:', error);
      throw error;
    }
  }
}
