import { useEffect, useRef, useState } from 'react';
import styles from './DashBoard.module.scss';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown, faArrowUp, faArrowUpFromBracket } from '@fortawesome/free-solid-svg-icons';
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
import { useTranslation } from 'react-i18next';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

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

enum FileType {
  DEFAULT = 'Default',
  LUMIN = 'Lumin',
}

interface fileData {
  filename: string;
  fileId: string;
  ownerName: string;
  ownerId: string;
  avatar: string;
  type: FileType;
  date: string;
  time: string;
}

function DashBoard() {
  const { t } = useTranslation('pages/DashBoard');

  const token = Cookies.get('DITokens');
  const navigate = useNavigate();
  const profile = useAuth();

  const maxSize = 20 * 1024 * 1024;
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const [isDesc, setIsDesc] = useState<boolean>(true); //Mặc định từ gần tới xa

  const [openPicker, authResponse] = useDrivePicker();

  const [warningPopup, setWarningPopup] = useState(false);
  const [warning, setWarning] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [successPopup, setSuccessPopup] = useState(false);

  const [isNoDocs, setIsNoDocs] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [totalDocs, setTotalDocs] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const [isDragging, setIsDragging] = useState(false);

  const [type, setType] = useState<FileType>(FileType.DEFAULT);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const [rows, setRows] = useState<fileData[]>([]);

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
        setWarning(t('Please ensure the upload file is not more than 20MB and in .pdf format.'));
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

  const toggleDropdown = (e: React.MouseEvent, fileType: FileType) => {
    e.stopPropagation();

    if (fileType === type) {
      setDropdownOpen(false);
    } else {
      setDropdownOpen(true);
      setType(fileType);
    }
    // setDropdownOpen((prev) => !prev);
    // setType(type);
  };

  // console.log('Current Type: ', type);

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
                setWarning(t('Please ensure the upload file is not more than 20MB and in .pdf format.'));
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
            setWarning(t('Please ensure the upload file is not more than 20MB and in .pdf format.'));
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
        setWarning(t('Please ensure the upload file is not more than 20MB and in .pdf format.'));
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

  const checkPdfPassword = async (file: File): Promise<boolean> => {
    const arrayBuffer = await file.arrayBuffer();

    try {
      await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      return false; // Không có password
    } catch (err: any) {
      if (err?.name === 'PasswordException') {
        return true; // Có password
      }
      return false;
    }
  };
  console.log(token);

  const uploadFile = async () => {
    if (!file) return;

    const isHasPass = await checkPdfPassword(file);

    if (isHasPass) {
      setWarning(t('Please ensure the upload file does not require any password.'));
      setWarningPopup(true);
      setTimeout(() => setWarningPopup(false), 2000);
      setFile(null);
    }

    const body = new FormData();
    body.append('file', file);
    body.append('fileName', file.name);
    body.append('fileSize', file.size.toString());
    body.append('type', type);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
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
        } else {
          console.error('Upload failed:', xhr.responseText);
          const response = JSON.parse(xhr.responseText);

          if (response.message === 'Out of memory!') {
            setWarning(t('You have used up all 1GB of space.'));
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

      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        isDesc: isDesc ? 'true' : 'false',
      });

      const res = await fetch(`${process.env.REACT_APP_BE_URI}/recent-document?${queryParams}`, {
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
          type: data.pdf.type,
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

  const isFirstRender = useRef(true);
  // console.log(token);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return; // bỏ qua lần chạy đầu
    }

    setRows([]);
    setTotalDocs(0);
    setCurrentPage(1);
    setPageCount(1);
    getAllDocument();
  }, [isDesc]);

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

  console.log(rows);

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
          <p>{t('Drag and drop PDF files here to upload')}</p>
        </div>
      )}
      {/* File header */}
      <div className={cx('header')}>
        <div className={cx('left-header')}>
          <h1 className={cx('text-header')}>{t('Recent Document')}</h1>
          <span className={cx('total-docs')}>
            {t('Total')} {totalDocs}
          </span>
        </div>
        <div className={cx('right-header')}>
          {/* Lumin Upload */}
          <div style={{ position: 'relative' }} className={cx('upload-container')}>
            <div
              className={cx('upload')}
              data-color="#EF3C5B"
              style={{ backgroundColor: '#EF3C5B' }}
              onClick={(e) => toggleDropdown(e, FileType.LUMIN)}
            >
              <img
                src="data:image/svg+xml,%3csvg width='113' height='113' viewBox='0 0 113 113' fill='none' xmlns='http://www.w3.org/2000/svg'%3e %3cg clip-path='url(%23clip0_173_7879)'%3e %3cpath d='M84.3267 0H28.6733C12.8375 0 0 12.8375 0 28.6733V84.3267C0 100.163 12.8375 113 28.6733 113H84.3267C100.163 113 113 100.163 113 84.3267V28.6733C113 12.8375 100.163 0 84.3267 0Z' fill='%23EF3C5B'/%3e %3cpath d='M54.1448 87.3609H54.1196C51.1987 87.3525 48.856 86.0701 47.5234 83.7484C44.7197 78.8662 46.6475 69.856 52.9336 58.168H27.3113C26.5653 58.168 25.8738 57.7698 25.5008 57.1203C25.1279 56.4707 25.1279 55.6744 25.5008 55.0291C37.6248 34.1423 50.9807 24.801 58.851 24.801H58.8762C61.7971 24.8094 64.1398 26.0918 65.4724 28.4135C68.2761 33.2957 66.3483 42.3059 60.058 53.9939H85.6887C86.4347 53.9939 87.1262 54.3921 87.4991 55.0416C87.8721 55.6912 87.8721 56.4875 87.4991 57.1328C75.3752 78.0196 62.015 87.3609 54.1448 87.3651V87.3609ZM57.7069 58.1721C50.3773 71.1049 49.4846 78.7782 51.1442 81.6698C51.5172 82.3194 52.2296 83.1785 54.128 83.1827H54.1448C60.4184 83.1827 71.7335 74.6126 81.9925 58.168H57.7027L57.7069 58.1721ZM31.0075 53.9939H55.2889C62.6185 41.057 63.5112 33.3879 61.8516 30.4963C61.4786 29.8467 60.7662 28.9876 58.8678 28.9834H58.851C52.5816 28.9834 41.2665 37.5535 31.0033 53.9939H31.0075Z' fill='white'/%3e %3c/g%3e %3cdefs%3e %3cclipPath id='clip0_173_7879'%3e %3crect width='113' height='113' fill='white'/%3e %3c/clipPath%3e %3c/defs%3e %3c/svg%3e"
                alt="logo-default"
                style={{ height: '24px', width: '24px', objectFit: 'cover' }}
              />
              {t('Lumin Upload')}
            </div>

            {dropdownOpen && type === FileType.LUMIN && (
              <div ref={dropdownRef} className={cx('upload-dropdown')}>
                <div className={cx('upload-option')} onClick={handleLocalClick}>
                  📁 {t('From local file')}
                </div>
                <div className={cx('upload-option')} onClick={async () => await handleDriveClick()}>
                  ☁️ {t('From Google Drive')}
                </div>
              </div>
            )}
          </div>

          {/* Default Upload */}
          <div style={{ position: 'relative' }} className={cx('upload-container')}>
            <div
              className={cx('upload')}
              data-color="#fcd965"
              style={{ backgroundColor: '#fcd965' }}
              onClick={(e) => toggleDropdown(e, FileType.DEFAULT)}
            >
              <FontAwesomeIcon icon={faArrowUpFromBracket} />
              {t('Default Upload')}
            </div>

            {dropdownOpen && type === FileType.DEFAULT && (
              <div ref={dropdownRef} className={cx('upload-dropdown')}>
                <div className={cx('upload-option')} onClick={handleLocalClick}>
                  📁 {t('From local file')}
                </div>
                <div className={cx('upload-option')} onClick={async () => await handleDriveClick()}>
                  ☁️ {t('From Google Drive')}
                </div>
              </div>
            )}
          </div>
        </div>

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
        <DocsEmpty toggleDropdown={(e: React.MouseEvent) => toggleDropdown(e, FileType.DEFAULT)} />
      ) : (
        <>
          <TableContainer component={Paper} style={{ overflow: 'hidden' }}>
            <Table sx={{ minWidth: 700 }} aria-label="customized table">
              <TableHead>
                <TableRow>
                  <StyledTableCell sx={{ width: '50%' }}>{t('File name')}</StyledTableCell>
                  <StyledTableCell sx={{ width: '35%' }} align="left">
                    {t('Document Owner')}
                  </StyledTableCell>
                  <StyledTableCell
                    sx={{ width: '15%' }}
                    align="left"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setIsDesc(!isDesc)}
                  >
                    {t('Last Updated')}
                    <FontAwesomeIcon style={{ marginLeft: '5px' }} icon={isDesc ? faArrowUp : faArrowDown} />
                  </StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!isLoading || rows.length > 0 ? (
                  rows.map((row) => (
                    <StyledTableRow
                      key={row.fileId}
                      style={{
                        cursor: 'pointer',
                        width: '100%',
                        height: '72px',
                      }}
                      className={cx('item')}
                      onClick={() => navigate(`/file/${row.fileId}`)}
                    >
                      <StyledTableCell component="th" scope="row">
                        <div
                          style={{
                            color: row.type === FileType.LUMIN ? '#F2385A' : undefined,
                            fontWeight: row.type === FileType.LUMIN ? '600' : '400',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {row.filename}
                          {row.type === FileType.LUMIN && (
                            <img
                              src="data:image/svg+xml,%3csvg width='113' height='113' viewBox='0 0 113 113' fill='none' xmlns='http://www.w3.org/2000/svg'%3e %3cg clip-path='url(%23clip0_173_7879)'%3e %3cpath d='M84.3267 0H28.6733C12.8375 0 0 12.8375 0 28.6733V84.3267C0 100.163 12.8375 113 28.6733 113H84.3267C100.163 113 113 100.163 113 84.3267V28.6733C113 12.8375 100.163 0 84.3267 0Z' fill='%23EF3C5B'/%3e %3cpath d='M54.1448 87.3609H54.1196C51.1987 87.3525 48.856 86.0701 47.5234 83.7484C44.7197 78.8662 46.6475 69.856 52.9336 58.168H27.3113C26.5653 58.168 25.8738 57.7698 25.5008 57.1203C25.1279 56.4707 25.1279 55.6744 25.5008 55.0291C37.6248 34.1423 50.9807 24.801 58.851 24.801H58.8762C61.7971 24.8094 64.1398 26.0918 65.4724 28.4135C68.2761 33.2957 66.3483 42.3059 60.058 53.9939H85.6887C86.4347 53.9939 87.1262 54.3921 87.4991 55.0416C87.8721 55.6912 87.8721 56.4875 87.4991 57.1328C75.3752 78.0196 62.015 87.3609 54.1448 87.3651V87.3609ZM57.7069 58.1721C50.3773 71.1049 49.4846 78.7782 51.1442 81.6698C51.5172 82.3194 52.2296 83.1785 54.128 83.1827H54.1448C60.4184 83.1827 71.7335 74.6126 81.9925 58.168H57.7027L57.7069 58.1721ZM31.0075 53.9939H55.2889C62.6185 41.057 63.5112 33.3879 61.8516 30.4963C61.4786 29.8467 60.7662 28.9876 58.8678 28.9834H58.851C52.5816 28.9834 41.2665 37.5535 31.0033 53.9939H31.0075Z' fill='white'/%3e %3c/g%3e %3cdefs%3e %3cclipPath id='clip0_173_7879'%3e %3crect width='113' height='113' fill='white'/%3e %3c/clipPath%3e %3c/defs%3e %3c/svg%3e"
                              alt="logo-default"
                              style={{ height: '20px', width: '20px', objectFit: 'cover', marginLeft: '5px' }}
                            />
                          )}
                        </div>
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
                            {row.ownerName} {row.ownerId === profile?._id && t('(You)')}
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
      {isUploading && <UploadProcess />}
    </div>
  ) : (
    <GuestDashboard />
  );
}

export default DashBoard;
