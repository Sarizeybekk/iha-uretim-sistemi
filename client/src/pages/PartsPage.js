import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, Badge, Spinner, Alert } from 'react-bootstrap';
import PartsService from '../services/PartsService';


const PartsPage = () => {
 const [parts, setParts] = useState([]);
 const [partTypes, setPartTypes] = useState([]);
 const [partStatuses, setPartStatuses] = useState([]);
 const [aircraftTypes, setAircraftTypes] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');


 // 🟢 Yeni parça için form state'i
 const [formData, setFormData] = useState({
   seri_no: '',
   parca_tipi: '',
   ucak_tipi: '',
   durum: '',
   notlar: ''
 });


 useEffect(() => {
   const fetchData = async () => {
     try {
       setLoading(true);
       const partsData = await PartsService.getAllParts();
       const partTypesData = await PartsService.getPartTypes();
       const partStatusesData = await PartsService.getPartStatuses();
       const aircraftTypesData = await PartsService.getAircraftTypes();


       setParts(partsData);
       setPartTypes(partTypesData);
       setPartStatuses(partStatusesData);
       setAircraftTypes(aircraftTypesData);
     } catch (err) {
       console.error('Veri çekme hatası:', err);
       setError('Veriler yüklenirken bir hata oluştu.');
     } finally {
       setLoading(false);
     }
   };


   fetchData();
 }, []);


 // 🟢 Form değişikliği
 const handleInputChange = (e) => {
   const { name, value } = e.target;
   setFormData(prev => ({ ...prev, [name]: value }));
 };


 // 🟢 Parça ekle
const handleCreatePart = async () => {
 try {
   const formattedData = {
     ...formData,
     parca_tipi: Number(formData.parca_tipi),  // 🟢 String to Number
     ucak_tipi: Number(formData.ucak_tipi),    // 🟢 String to Number
     durum: Number(formData.durum)             // 🟢 String to Number
   };


   console.log(" Parça ekleniyor, veriler:", formattedData);


   await PartsService.createPart(formattedData);
   alert('Parça başarıyla eklendi!');


   // Parçaları yeniden yükle
   const partsData = await PartsService.getAllParts();
   setParts(partsData);


   // Formu sıfırla
   setFormData({
     seri_no: '',
     parca_tipi: '',
     ucak_tipi: '',
     durum: '',
     notlar: ''
   });
 } catch (err) {
   // 🟢 Hata mesajını yakala
   const errorMessage = err.response?.data || 'Parça eklenirken bir hata oluştu.';
   console.error('Parça eklenirken hata:', errorMessage);


   // 🟢 Kullanıcıya hata mesajı göster
   if (Array.isArray(errorMessage)) {
     alert(` ${errorMessage[0]}`);
   } else if (typeof errorMessage === 'string') {
     alert(`${errorMessage}`);
   } else {
     alert(' Beklenmeyen bir hata oluştu!');
   }
 }
};
const handleDeletePart = async (id) => {
 if (window.confirm('Bu parçayı silmek istediğinize emin misiniz?')) {
   try {
     await PartsService.deletePart(id);
     alert('✅ Parça başarıyla silindi!');


     // Parçaları yeniden yükle
     const partsData = await PartsService.getAllParts();
     setParts(partsData);
   } catch (err) {
     const errorMessage = err.response?.data?.message || 'Parça silinirken bir hata oluştu.';
     console.error('Parça silinirken hata:', errorMessage);
     alert(`❌ ${errorMessage}`);
   }
 }
};










 return (
   <Container fluid className="py-4">
     <Card className="mb-4 shadow-sm">
       <Card.Header className="bg-light">
         <h4>Parça Yönetimi</h4>
       </Card.Header>
       <Card.Body>
         {error && <Alert variant="danger">{error}</Alert>}


         {/* 🟢 Parça Ekleme Formu */}
         <Form className="mb-4">
           <Row className="mb-3">
             <Col>
               <Form.Control
                 type="text"
                 name="seri_no"
                 value={formData.seri_no}
                 onChange={handleInputChange}
                 placeholder="Seri No"
               />
             </Col>
             <Col>
               <Form.Select
               name="parca_tipi"
               value={formData.parca_tipi}
               onChange={handleInputChange}
               required
             >
               <option value="">Seçiniz</option>
               {partTypes.map(type => (
                 <option key={type.id} value={type.id}>{type.ad}</option>
               ))}
             </Form.Select>
             </Col>
             <Col>
               <Form.Select name="ucak_tipi" value={formData.ucak_tipi} onChange={handleInputChange}>
                 <option value="">Uçak Tipi Seç</option>
                 {aircraftTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.kod}</option>
                 ))}
               </Form.Select>
             </Col>
             <Col>
               <Form.Select name="durum" value={formData.durum} onChange={handleInputChange}>
                 <option value="">Durum Seç</option>
                 {partStatuses.map(status => (
                   <option key={status.id} value={status.id}>{status.ad}</option>
                 ))}
               </Form.Select>
             </Col>
             <Col>
               <Button variant="primary" onClick={handleCreatePart}>Parça Ekle</Button>
             </Col>
           </Row>
           <Form.Group>
             <Form.Control
               as="textarea"
               rows={2}
               name="notlar"
               value={formData.notlar}
               onChange={handleInputChange}
               placeholder="Notlar"
             />
           </Form.Group>
         </Form>


         {/* 🟢 Parça Listesi */}
         <Table bordered hover>
           <thead className="bg-light">
             <tr>
               <th>Seri No</th>
               <th>Parça Tipi</th>
               <th>Uçak Tipi</th>
               <th>Durum</th>
               <th>İşlemler</th>
             </tr>
           </thead>
           <tbody>
             {parts.length > 0 ? parts.map(part => (
               <tr key={part.id}>
                 <td>{part.seri_no}</td>
                 <td>{part.parca_tipi_adi || 'Belirtilmemiş'}</td>
                 <td>{part.ucak_tipi_kodu || 'Belirtilmemiş'}</td>
                 <td><Badge bg="info">{part.durum_adi || 'Belirtilmemiş'}</Badge></td>
                 <td><Button variant="outline-danger" size="sm" onClick={() => handleDeletePart(part.id)}>Sil</Button></td>
               </tr>
             )) : (
               <tr>
                 <td colSpan="5" className="text-center">Parça bulunamadı</td>
               </tr>
             )}
           </tbody>
         </Table>
       </Card.Body>
     </Card>
   </Container>
 );
};


export default PartsPage;
