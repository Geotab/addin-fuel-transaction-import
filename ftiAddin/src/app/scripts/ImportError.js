export class ImportError extends Error {
   constructor(message, moreInfo) {
     super(message); // (1)
     this.name = 'ImportError'; // (2)
     this.moreInfo = moreInfo;
   }
 }
