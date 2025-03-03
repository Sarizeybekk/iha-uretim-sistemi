import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, Alert, Badge } from 'react-bootstrap';
import PartsService from '../services/PartsService';
import AircraftService from '../services/AircraftService';

const AircraftAssemblyPage = () => {
  const [parts, setParts] = useState([]);
  const [aircraftTypes, setAircraftTypes] = useState([]);  // 🟢 Dizi olarak başlat
  const [assembledAircrafts, setAssembledAircrafts] = useState([]);
  const [selectedParts, setSelectedParts] = useState([]);
  const [selectedAircraftType, setSelectedAircraftType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const partsData = await PartsService.getAllParts();
        const aircraftTypesData = await AircraftService.getAircraftTypes();
        const assembledAircraftsData = await AircraftService.getAssembledAircrafts();

        setParts(Array.isArray(partsData) ? partsData : []);  // 🟢 Eğer dizi değilse, boş dizi ata
        setAircraftTypes(Array.isArray(aircraftTypesData) ? aircraftTypesData : []);  // 🟢 Kontrol eklendi
        setAssembledAircrafts(Array.isArray(assembledAircraftsData) ? assembledAircraftsData : []);  // 🟢 Kontrol eklendi
      } catch (err) {
        console.error('Veri çekme hatası:', err);
        setError('Veriler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Container fluid className="py-4">
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-light">
          <h4>Uçak Montaj Yönetimi</h4>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form className="mb-4">
            <Row className="mb-3">
              <Col>
                <Form.Select
                  value={selectedAircraftType}
                  onChange={(e) => setSelectedAircraftType(e.target.value)}
                >
                  <option value="">Uçak Tipi Seç</option>
                  {aircraftTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.kod}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col>
                <Button variant="primary" disabled={!selectedAircraftType}>
                  Uçak Montajı Yap
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AircraftAssemblyPage;
