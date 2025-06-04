import { useEffect } from 'react';
import axios from 'axios'; // ✅ Dùng import thay vì require

export function Test() {
  // useEffect(() => {
  //   const config = {
  //     method: 'get',
  //     maxBodyLength: Infinity,
  //     url: 'https://api.luminpdf.com/v1/user/info',
  //     headers: {
  //       Accept: 'application/json',
  //       'x-api-key': 'sffnh4rdwgzacy3s79y7igw36brdetox58a9202d12e041fbb3e6c07a2db062bd',
  //     },
  //   };

  //   axios
  //     .request(config)
  //     .then((response) => {
  //       console.log('API response:', response.data);
  //     })
  //     .catch((error) => {
  //       console.error('API error:', error);
  //     });
  // }, []);

  // useEffect(() => {
  //   const config = {
  //     method: 'get',
  //     maxBodyLength: Infinity,
  //     url: 'https://api.luminpdf.com/v1/signature_request/683d1619fe9901241c31d215',
  //     headers: {
  //       Accept: 'application/json',
  //       'x-api-key': 'sffnh4rdwgzacy3s79y7igw36brdetox58a9202d12e041fbb3e6c07a2db062bd',
  //     },
  //   };

  //   axios
  //     .request(config)
  //     .then((response) => {
  //       console.log('API response:', response.data);
  //     })
  //     .catch((error) => {
  //       console.error('API error:', error);
  //     });
  // }, []);

  // let data = JSON.stringify({
  //   file_url: 'https://res.cloudinary.com/dgfmpovjz/raw/upload/v1748918520/m0ubp6q7d0irupvchk9l.pdf',
  //   title: 'Lab4-Report',
  //   signers: [
  //     {
  //       email_address: 'vulh@dgroup.co',
  //       name: 'Vu',
  //       group: 1,
  //     },
  //   ],
  //   viewers: [
  //     {
  //       email_address: 'hoangle293vu@gmail.com',
  //       name: 'Le Vu',
  //     },
  //   ],
  //   expires_at: 1927510980694,
  //   use_text_tags: false,
  //   signing_type: 'ORDER',
  // });

  // useEffect(() => {
  //   const config = {
  //     method: 'post',
  //     maxBodyLength: Infinity,
  //     url: 'https://api.luminpdf.com/v1/signature_request/send',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       Accept: 'application/json',
  //       'x-api-key': 'sffnh4rdwgzacy3s79y7igw36brdetox58a9202d12e041fbb3e6c07a2db062bd',
  //     },
  //     data: data,
  //   };

  //   axios
  //     .request(config)
  //     .then((response) => {
  //       console.log('API response:', response.data);
  //     })
  //     .catch((error) => {
  //       console.error('API error:', error);
  //     });
  // }, []);

  // useEffect(() => {
  //   const config = {
  //     method: 'get',
  //     maxBodyLength: Infinity,
  //     url: 'https://api.luminpdf.com/v1/signature_request/files/683d1619fe9901241c31d215',
  //     headers: {
  //       Accept: 'application/json',
  //       'x-api-key': 'sffnh4rdwgzacy3s79y7igw36brdetox58a9202d12e041fbb3e6c07a2db062bd',
  //     },
  //   };

  //   axios
  //     .request(config)
  //     .then((response) => {
  //       console.log(typeof response.data);
  //       console.log(JSON.stringify(response.data));
  //     })
  //     .catch((error) => {
  //       console.error('API error:', error);
  //     });
  // }, []);

  // useEffect(() => {
  //   const config = {
  //     method: 'get',
  //     maxBodyLength: Infinity,
  //     url: 'https://api.luminpdf.com/v1/signature_request/files_as_file_url/683d1619fe9901241c31d215',
  //     headers: {
  //       Accept: 'application/json',
  //       'x-api-key': 'sffnh4rdwgzacy3s79y7igw36brdetox58a9202d12e041fbb3e6c07a2db062bd',
  //     },
  //   };

  //   axios
  //     .request(config)
  //     .then((response) => {
  //       console.log(typeof response.data);
  //       console.log(JSON.stringify(response.data));
  //     })
  //     .catch((error) => {
  //       console.error('API error:', error);
  //     });
  // }, []);

  return <h1>Hehe</h1>;
}
