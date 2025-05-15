import { useState } from 'react';
import { Document, Page } from 'react-pdf';
import styles from "./PdfViewer.module.scss"
import classNames from "classnames/bind"

const cx = classNames.bind(styles)

const PdfViewer: React.FC = () => {
  const [pdfData, setPdfData] = useState<string | null>(
    'https://res.cloudinary.com/dgfmpovjz/raw/upload/v1747272641/lawr4vvuhc5w69ryhpzx.pdf',
  );
  // const [numPages, setNumPages] = useState<number>(0);

  //   useEffect(() => {
  //     fetch('http://localhost:3000/pdf') // endpoint từ server NestJS
  //       .then((response) => response.arrayBuffer())
  //       .then((data) => setPdfData(data))
  //       .catch((error) => console.error('Error fetching PDF:', error));
  //   }, []);

  const [numPages, setNumPages] = useState<number>(0);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <div className={cx('wrapper')}>

      <div className={cx('pdf-section')}>
        {pdfData ? (
          <Document file={pdfData} onLoadSuccess={onDocumentLoadSuccess}>
            {Array.from(new Array(numPages), (_, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                renderAnnotationLayer={true}
                renderTextLayer={true}
                scale={1.5}
                className="mb-6"
              />
            ))}
          </Document>
        ) : (
          <p>Đang tải PDF...</p>
        )}
      </div>
    </div>
  );

  // return (
  //   <div className="p-4">
  //     {pdfData ? (
  //       <Document file={ pdfData } onLoadSuccess={onDocumentLoadSuccess}>
  //         {Array.from(new Array(numPages), (_, index) => (
  //           <Page key={index} pageNumber={index + 1} />
  //         ))}
  //       </Document>
  //     ) : (
  //       <p>Đang tải PDF...</p>
  //     )}
  //   </div>
  // );
};

export default PdfViewer;
