import { useEffect, useState } from 'react';
import { Document, Page } from 'react-pdf';
import styles from './PdfViewer.module.scss';
import classNames from 'classnames/bind';
import Cookies from 'js-cookie';
import { useParams, useSearchParams } from 'react-router-dom';

const cx = classNames.bind(styles);

const PdfViewer: React.FC = () => {
  const token = Cookies.get('DITokens');
  const { id } = useParams();

  const [pdfData, setPdfData] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);

  const getPdf = async () => {
    try {
      // console.log('URL: ', `${process.env.REACT_APP_BE_URI}/pdf-files/${id}`);
      const res = await fetch(`${process.env.REACT_APP_BE_URI}/pdf-files/${id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.log('Error Response:', errorData);
        // if (errorData.message === 'File id not found') {
        //   console.log(err)
        // } else if (errorData.message === 'You have no permission') {

        // }
        throw new Error(errorData.message || 'Invalid credentials');
      }

      const responseData = await res.json();
      console.log('Response: ', responseData.data);
    } catch (error) {
      console.error('Post subject error:', error);
      return;
    }
  };

  useEffect(() => {
    getPdf();
  }, []);

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
