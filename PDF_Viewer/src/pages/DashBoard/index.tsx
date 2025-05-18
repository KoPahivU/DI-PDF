import { useEffect, useRef, useState } from 'react';
import styles from './DashBoard.module.scss';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpFromBracket, faCheckToSlot, faTriangleExclamation, faXmark } from '@fortawesome/free-solid-svg-icons';
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
import ReactPaginate from 'react-paginate';
import { useNavigate } from 'react-router-dom';

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
  avatar: string;
  date: string;
  time: string;
}

// const rows = [
//   createData({ filename: 'Frozen yoghurt', fileId: '1' }, { name: 'hehe', avatar: '' }, { date: '12', time: '12' }),
//   createData({ filename: 'Frozen yoghurt', fileId: '2' }, { name: 'hehe', avatar: '' }, { date: '', time: '' }),
//   createData({ filename: 'Frozen yoghurt', fileId: '3' }, { name: 'hehe', avatar: '' }, { date: '', time: '' }),
//   createData({ filename: 'Frozen yoghurt', fileId: '4' }, { name: 'hehe', avatar: '' }, { date: '', time: '' }),
//   createData({ filename: 'Frozen yoghurt', fileId: '5' }, { name: 'hehe', avatar: '' }, { date: '', time: '' }),
// ];

function DashBoard() {
  const navigate = useNavigate();
  const maxSize = 20 * 1024 * 1024;
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [openPicker, authResponse] = useDrivePicker();

  const [warningPopup, setWarningPopup] = useState(false);
  const [successPopup, setSuccessPopup] = useState(false);
  const [totalDocs, setTotalDocs] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  //   const [showUpload, setShowUpload] = useState(true);

  const [rows, setRows] = useState<fileData[]>([]);

  const token = Cookies.get('DITokens');

  // console.log('Token: ', token);

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
                throw new Error('Failed to download file from Google Drive');
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
    const selectedFile = e.target.files?.[0];

    if (selectedFile) {
      if (selectedFile?.size > maxSize) {
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
    try {
      if (!file) {
        return;
      }
      const body = new FormData();
      body.append('file', file);
      body.append('fileName', file?.name);
      body.append('fileSize', file?.size.toString());

      const res = await fetch(`${process.env.REACT_APP_BE_URI}/pdf-files/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: body,
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.log('Error Response:', errorData);
        throw new Error(errorData.message || 'Invalid credentials');
      }

      const responseData = await res.json();
      setSuccessPopup(true);
      setTimeout(() => {
        setSuccessPopup(false);
      }, 2000);
      console.log('Response: ', responseData.data);
    } catch (error) {
      console.error('Post subject error:', error);
      return;
    }
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
      const res = await fetch(`${process.env.REACT_APP_BE_URI}/recent-document?page=${currentPage}&limit=5`, {
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

      const newRows: fileData[] = responseData.data.returnData.map((data: any) => {
        const updatedDate = new Date(data.recent.date);

        return {
          filename: data.pdf.fileName,
          fileId: data.pdf._id,
          ownerName: data.user.fullName,
          avatar: data.user.avatar,
          date: updatedDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
          time: updatedDate
            .toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            })
            .replace(/ /g, ''),
        };
      });

      setRows(newRows);
    } catch (error) {
      console.error('Get documents error:', error);
    }
  };

  console.log('Rows: ', rows);

  useEffect(() => {
    const fetchData = async () => {
      await getAllDocument();
    };

    fetchData();
  }, [currentPage]);

  return (
    <div className={cx('wrapper')}>
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
            {rows.length > 0 ? (
              rows.map((row) => (
                <StyledTableRow
                  key={row.filename}
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
                        src={row.avatar || 'https://i.pinimg.com/736x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg'}
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
                      <span style={{ fontSize: '1.5rem' }}>{row.ownerName}</span>
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

      {/* {showUpload && <UploadFile setShowUpload={setShowUpload} />} */}

      {warningPopup && (
        <div className={cx('error-popup')}>
          <div style={{ display: 'flex', gap: '5px' }}>
            <FontAwesomeIcon style={{ width: '25px', height: '25px' }} icon={faTriangleExclamation} />
            <div>
              <h4>Cannot upload this file</h4>
              <span style={{ maxWidth: '400px', fontSize: '1.3rem' }}>
                Please ensure the upload file is not more than 20MB and in .pdf format
              </span>
            </div>
            <FontAwesomeIcon
              style={{ width: '18px', height: '18px', alignSelf: 'center', cursor: 'pointer' }}
              icon={faXmark}
              onClick={() => setWarningPopup(false)}
            />
          </div>
        </div>
      )}

      {successPopup && (
        <div className={cx('success-popup')}>
          <div style={{ display: 'flex', gap: '5px' }}>
            <FontAwesomeIcon style={{ width: '25px', height: '25px' }} icon={faCheckToSlot} />
            <h4>Uploaded successfully</h4>
            <FontAwesomeIcon
              style={{ width: '18px', height: '18px', alignSelf: 'center', cursor: 'pointer', marginLeft: '20px' }}
              icon={faXmark}
              onClick={() => setSuccessPopup(false)}
            />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '10px' }}>
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          style={{ padding: '8px 12px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
        >
          Previous
        </button>

        <span style={{ lineHeight: '32px' }}>
          Page {currentPage} / {pageCount}
        </span>

        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pageCount))}
          disabled={currentPage === pageCount}
          style={{ padding: '8px 12px', cursor: currentPage === pageCount ? 'not-allowed' : 'pointer' }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default DashBoard;
