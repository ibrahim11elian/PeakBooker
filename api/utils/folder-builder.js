import fs from 'fs';
import path from 'path';

const folderBuilder = () => {
  const directories = [
    'uploads/users',
    'uploads/tours/covers',
    'uploads/tours/images',
  ];

  directories.forEach((dir) => {
    fs.mkdirSync(path.resolve(dir), { recursive: true });
  });
};

export default folderBuilder;
