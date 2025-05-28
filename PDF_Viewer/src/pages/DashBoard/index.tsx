import { useEffect, useRef, useState } from 'react';
import styles from './DashBoard.module.scss';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpFromBracket } from '@fortawesome/free-solid-svg-icons';
import { styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Typography } from '@mui/material';
import Cookies from 'js-cookie';
import useDrivePicker from 'react-google-drive-picker';
import { useNavigate } from 'react-router-dom';
import { UploadSucess } from '../../components/Popup/UploadSucess';
import { UploadWarning } from '../../components/Popup/UploadWarning';
import { DocsEmpty } from '../../components/DocsEmpty';
import { useAuth } from '../../layout/DashBoardLayout';
import { GuestDashboard } from '../../components/GuestDashboard';
import { UploadProcess } from '../../components/Popup/UploadProcess';

const cx = classNames.bind(styles);

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: '#F5F5F5',
    color: theme.palette.common.black,
    fontSize: 17,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  //   '&:nth-of-type(odd)': {
  //     backgroundColor: theme.palette.action.hover,
  //   },
  //   '&:last-child td, &:last-child th': {
  //     border: 0,
  //   },
}));

interface fileData {
  filename: string;
  fileId: string;
  ownerName: string;
  ownerId: string;
  avatar: string;
  date: string;
  time: string;
}

function DashBoard() {
  const navigate = useNavigate();
  const profile = useAuth();

  const maxSize = 20 * 1024 * 1024;
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [openPicker, authResponse] = useDrivePicker();

  const [warningPopup, setWarningPopup] = useState(false);
  const [warning, setWarning] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [successPopup, setSuccessPopup] = useState(false);

  const [isNoDocs, setIsNoDocs] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [totalDocs, setTotalDocs] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const [isDragging, setIsDragging] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const [rows, setRows] = useState<fileData[]>([]);

  const token = Cookies.get('DITokens');

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      // Kiểm tra kích thước và định dạng
      if (droppedFile.size > maxSize || droppedFile.type !== 'application/pdf') {
        setWarning('Please ensure the upload file is not more than 20MB and in .pdf format.');
        setWarningPopup(true);
        setTimeout(() => setWarningPopup(false), 2000);
        setFile(null);
        return;
      }
      setFile(droppedFile);
    }
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  const handleLocalClick = () => {
    inputRef.current?.click();
    setDropdownOpen(false);
  };

  const handleDriveClick = async () => {
    openPicker({
      clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID ?? '',
      developerKey: process.env.REACT_APP_GOOGLE_API_KEY ?? '',
      viewId: 'DOCS',
      showUploadView: true,
      showUploadFolders: true,
      supportDrives: true,
      multiselect: false,
      callbackFunction: async (data) => {
        if (data.action === 'picked') {
          const pickedFile = data.docs[0];

          if (pickedFile.mimeType === 'application/pdf') {
            try {
              const accessToken = authResponse?.access_token;

              if (!accessToken) {
                alert('Google Drive access token not found.');
                return;
              }

              // URL download file from Google Drive API
              const downloadUrl = `https://www.googleapis.com/drive/v3/files/${pickedFile.id}?alt=media`;

              // Fetch file as blob
              const response = await fetch(downloadUrl, {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              });

              if (!response.ok) {
                setWarningPopup(true);
                setWarning('Please ensure the upload file is not more than 20MB and in .pdf format.');
                setTimeout(() => {
                  setWarningPopup(false);
                }, 2000);
                setFile(null);
                return;
              }

              const blob = await response.blob();

              // Tạo đối tượng File từ Blob để upload
              const file = new File([blob], pickedFile.name, { type: pickedFile.mimeType });

              setFile(file);
            } catch (error) {
              console.error('Error downloading Google Drive file:', error);
              alert('Failed to load file from Google Drive.');
              setFile(null);
            }
          } else {
            setWarning('Please ensure the upload file is not more than 20MB and in .pdf format.');
            setWarningPopup(true);
            setTimeout(() => {
              setWarningPopup(false);
            }, 2000);
            setFile(null);
          }
        }
      },
    });
    setDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(`.${cx('right-header')}`)
      ) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File change');
    const selectedFile = e.target.files?.[0];

    if (selectedFile) {
      if (selectedFile?.size > maxSize) {
        setWarning('Please ensure the upload file is not more than 20MB and in .pdf format.');
        setWarningPopup(true);
        setTimeout(() => {
          setWarningPopup(false);
        }, 2000);
        setFile(null);
        return;
      }

      setFile(selectedFile);
    }
  };

  const uploadFile = async () => {
    if (!file) return;

    const body = new FormData();
    body.append('file', file);
    body.append('fileName', file.name);
    body.append('fileSize', file.size.toString());

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        if (percent > 90) {
          setUploadProgress(90);
        } else setUploadProgress(percent);
        setIsUploading(true);
      }
    });

    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        setIsUploading(false);
        if (xhr.status === 200 || xhr.status === 201) {
          setSuccessPopup(true);
          setTimeout(() => {
            setSuccessPopup(false);
            window.location.reload();
          }, 1000);
          setFile(null);
          setUploadProgress(0);
        } else {
          console.error('Upload failed:', xhr.responseText);
          const response = JSON.parse(xhr.responseText);

          if (response.message === 'Out of memory!') {
            setWarning('You have used up all 1GB of space.');
            setWarningPopup(true);
            setTimeout(() => {
              setWarningPopup(false);
            }, 2000);
            setFile(null);
          }
        }
      }
    };

    xhr.open('POST', `${process.env.REACT_APP_BE_URI}/pdf-files/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(body);
  };

  useEffect(() => {
    if (!file) return;

    const upload = async () => {
      await uploadFile();
    };

    upload();
  }, [file]);

  const getAllDocument = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${process.env.REACT_APP_BE_URI}/recent-document?page=${currentPage}&limit=10`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.log('Error Response:', errorData);
        throw new Error(errorData.message || 'Invalid credentials');
      }

      const responseData = await res.json();
      console.log('Response: ', responseData.data);
      setTotalDocs(responseData.data.totalRecords);
      setPageCount(responseData.data.totalPages);

      if (responseData.data.returnData.length === 0) {
        setIsNoDocs(true);
      }

      const newRows: fileData[] = responseData.data.returnData.map((data: any) => {
        const [time, date] = data.recent.date.split(' ');

        return {
          filename: data.pdf.fileName,
          fileId: data.pdf._id,
          ownerName: data.user.fullName,
          ownerId: data.user._id,
          avatar: data.user.avatar,
          date,
          time,
        };
      });
      setRows((prev) => [...prev, ...newRows]);
    } catch (error) {
      console.error('Get documents error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getAllDocument();
  }, [currentPage]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && currentPage < pageCount) {
          setCurrentPage((prev) => prev + 1);
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 1.0,
      },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) observer.unobserve(loadMoreRef.current);
    };
  }, [isLoading, currentPage, pageCount]);

  return token ? (
    <div
      className={cx('wrapper')}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
    >
      {/* Overlay hiển thị khi đang kéo file vào */}
      {isDragging && (
        <div className={cx('drag-overlay')}>
          <p>Drag and drop PDF files here to upload</p>
        </div>
      )}
      {/* File header */}
      <div className={cx('header')}>
        <div className={cx('left-header')}>
          <h1 className={cx('text-header')}>Recent Document</h1>
          <span className={cx('total-docs')}>Total {totalDocs}</span>
        </div>
        <div className={cx('right-header')} onClick={toggleDropdown}>
          <FontAwesomeIcon className={cx('upload')} icon={faArrowUpFromBracket} />
          Upload Document
        </div>

        {dropdownOpen && (
          <div ref={dropdownRef} className={cx('upload-dropdown')}>
            <div className={cx('upload-option')} onClick={handleLocalClick}>
              📁 From local file
            </div>
            <div className={cx('upload-option')} onClick={async () => await handleDriveClick()}>
              ☁️ From Google Drive
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          accept=".pdf"
          id="file"
          type="file"
          onChange={async (e) => await handleFileChange(e)}
          style={{ display: 'none' }}
        />
      </div>

      {/* Watch file */}
      {isNoDocs ? (
        <DocsEmpty toggleDropdown={toggleDropdown} />
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 700 }} aria-label="customized table">
              <TableHead>
                <TableRow>
                  <StyledTableCell sx={{ width: '50%' }}>File name</StyledTableCell>
                  <StyledTableCell sx={{ width: '30%' }} align="left">
                    Document Owner
                  </StyledTableCell>
                  <StyledTableCell sx={{ width: '20%' }} align="center">
                    Last Updated
                  </StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!isLoading || rows.length > 0 ? (
                  rows.map((row) => (
                    <StyledTableRow
                      key={row.fileId}
                      style={{ cursor: 'pointer', width: '100%' }}
                      className={cx('item')}
                      onClick={() => navigate(`/file/${row.fileId}`)}
                    >
                      <StyledTableCell component="th" scope="row">
                        {row.filename}
                      </StyledTableCell>
                      <StyledTableCell align="left">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <img
                            src={
                              row?.avatar !== ''
                                ? row?.avatar
                                : 'https://i.pinimg.com/736x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg'
                            }
                            alt="avatar"
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              marginRight: '10px',
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ fontSize: '1.5rem' }}>
                            {row.ownerName} {row.ownerId === profile?._id && '(You)'}
                          </span>
                        </div>
                      </StyledTableCell>
                      <StyledTableCell align="left">
                        <Typography variant="subtitle1" sx={{ fontSize: '1.5rem', lineHeight: 1.2 }}>
                          {row.date}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '1.2rem', color: '#757575' }}>
                          {row.time}
                        </Typography>
                      </StyledTableCell>
                    </StyledTableRow>
                  ))
                ) : (
                  <>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <StyledTableRow key={index} className={cx('pulse')}>
                        <StyledTableCell component="th" scope="row">
                          <div className={cx('skeleton', 'skeletonTextLong')}></div>
                        </StyledTableCell>
                        <StyledTableCell align="left">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className={cx('skeletonCircle')} style={{ width: 40, height: 40 }}></div>
                            <div className={cx('skeleton', 'skeletonTextShort')}></div>
                          </div>
                        </StyledTableCell>
                        <StyledTableCell align="left">
                          <div className={cx('skeleton', 'skeletonTextShort')}></div>
                          <div className={cx('skeleton', 'skeletonSmallText')}></div>
                        </StyledTableCell>
                      </StyledTableRow>
                    ))}
                  </>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Load more trigger */}
          <div ref={loadMoreRef} style={{ height: '20px', marginTop: '10px' }}></div>
        </>
      )}

      {warningPopup && <UploadWarning setWarningPopup={setWarningPopup} text={warning} />}
      {successPopup && <UploadSucess setSuccessPopup={setSuccessPopup} />}
      {isUploading && <UploadProcess uploadProgress={uploadProgress} />}
    </div>
  ) : (
    <GuestDashboard />
  );
}

export default DashBoard;
