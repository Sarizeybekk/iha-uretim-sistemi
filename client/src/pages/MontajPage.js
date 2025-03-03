import React, { useEffect, useState } from 'react';
import {
  Container, Row, Col, Card, Button, Spinner, Alert, Badge, Form, Modal,
  Table, Tabs, Tab, Nav, Accordion, ListGroup
} from 'react-bootstrap';
import apiClient, { API } from '../services/apiConfig';
import { toast } from 'react-toastify';

// Font Awesome ve CSS dosyası import'larını kaldırdık

const MontajPage = () => {
  // State tanımlamaları
  const [activeTab, setActiveTab] = useState('dashboard');
  const [aircraftTypes, setAircraftTypes] = useState([]);
  const [aircrafts, setAircrafts] = useState([]);
  const [assemblyStatus, setAssemblyStatus] = useState([]);
  const [parts, setParts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedAircraftType, setSelectedAircraftType] = useState(null);
  const [requiredParts, setRequiredParts] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAircraft, setSelectedAircraft] = useState(null);
  const [statsData, setStatsData] = useState({
    totalAircrafts: 0,
    byType: {},
    assemblyReady: 0,
    notReady: 0
  });

  const [montajData, setMontajData] = useState({
    ucak_tipi: '',
    seri_no: '',
    kanat_parca_id: '',
    govde_parca_id: '',
    kuyruk_parca_id: '',
    aviyonik_parca_id: '',
    notlar: ''
  });

  // Veri çekme işlemi
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('🔄 API İstekleri Başlatılıyor...');

        const [typesRes, aircraftsRes, assemblyStatusRes, partsRes, inventoryRes] = await Promise.all([
          apiClient.get(API.aircrafts.types),
          apiClient.get(API.aircrafts.list),
          apiClient.get(API.aircrafts.assemblyStatus),
          apiClient.get(API.parts.list),
          apiClient.get(API.inventory.list)
        ]);

        const typesData = typesRes.data.results || typesRes.data || [];
        setAircraftTypes(typesData);

        // API'den gelen uçak verilerini düzenleyelim
        const aircraftData = aircraftsRes.data.results || aircraftsRes.data || [];

        // Her bir uçak için detaylı bilgileri alalım
        const detailedAircrafts = await Promise.all(
          aircraftData.map(async (aircraft) => {
            try {
              // Uçak detaylarını API'den alalım
              const detailRes = await apiClient.get(API.aircrafts.detail(aircraft.id));
              return {
                ...aircraft,
                ...detailRes.data
              };
            } catch (detailErr) {
              console.warn(`⚠️ Uçak detayı alınamadı: #${aircraft.id}`, detailErr);
              return aircraft;
            }
          })
        );

        setAircrafts(detailedAircrafts);

        const statusData = assemblyStatusRes.data || [];
        setAssemblyStatus(statusData);

        setParts(partsRes.data.results || partsRes.data || []);

        // Envanter verilerini ayarla
        const inventoryData = inventoryRes.data.results || inventoryRes.data || [];
        setInventory(inventoryData);

        // İstatistikleri hazırla
        prepareStatistics(detailedAircrafts, typesData, statusData);

        console.log('✅ Tüm veriler başarıyla yüklendi');
      } catch (err) {
        console.error('❌ Veri Çekme Hatası:', err.response?.data || err);
        setError('Veriler yüklenirken bir hata oluştu.');
        toast.error('Veriler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // İstatistik verilerini hazırla
  const prepareStatistics = (aircraftsData, typesData, statusData) => {
    const stats = {
      totalAircrafts: aircraftsData.length,
      byType: {},
      assemblyReady: 0,
      notReady: 0
    };

    // Uçak tiplerine göre sayıları hesapla
    typesData.forEach(type => {
      const typeAircrafts = aircraftsData.filter(aircraft => aircraft.ucak_tipi === type.id);
      stats.byType[type.kod] = {
        count: typeAircrafts.length,
        name: type.ad
      };
    });

    // Montaja hazır ve hazır olmayan tipler
    statusData.forEach(status => {
      if (status.montaj_icin_yeterli) {
        stats.assemblyReady++;
      } else {
        stats.notReady++;
      }
    });

    setStatsData(stats);
  };

  // Dropdown ile uçak tipi seçildiğinde
  const handleAircraftTypeChange = (e) => {
    const selectedTypeId = e.target.value;
    if (!selectedTypeId) return;

    const selectedType = aircraftTypes.find(type => String(type.id) === selectedTypeId);
    setSelectedAircraftType(selectedType);

    // Seçilen uçak tipine göre parça durumlarını güncelle
    updateRequiredParts(selectedType);
  };

  // Uçak tipi seçildiğinde gerekli parçaları belirleme
  const updateRequiredParts = (aircraftType) => {
    if (!aircraftType) return;

    // Seçilen uçak tipine göre filtreleme yap
    const aircraftTypeId = aircraftType.id;
    const aircraftTypeCode = aircraftType.kod;

    // İlgili uçak tipine ait envanter parçalarını bul
    const filteredInventory = inventory.filter(item =>
      item.ucak_tipi === aircraftTypeId ||
      item.ucak_tipi_kodu === aircraftTypeCode
    );

    // Gerekli parça tiplerini tanımla
    const requiredPartTypes = ['Kanat', 'Gövde', 'Kuyruk', 'Aviyonik'];

    // Her parça tipi için durumu belirle
    const partsStatus = requiredPartTypes.map(partType => {
      // Bu parça tipine ait envanter öğesini bul
      const inventoryItem = filteredInventory.find(item =>
        item.parca_tipi_adi === partType ||
        (item.parca_tipi_detay && item.parca_tipi_detay.ad === partType)
      );

      // İlgili parça tipine göre parts listesinden uygun parçayı bul
      const availablePart = parts.find(part =>
        part.parca_tipi_adi === partType ||
        (part.parca_tipi_detay && part.parca_tipi_detay.ad === partType)
      );

      return {
        name: partType,
        available: inventoryItem ? inventoryItem.mevcut_adet : 0,
        required: 1,
        status: (inventoryItem && inventoryItem.mevcut_adet >= 1) ? 'Yeterli' : 'Yetersiz',
        partId: availablePart ? availablePart.id : null
      };
    });

    setRequiredParts(partsStatus);

    // Montaj verilerini güncelle
    updateMontajData(aircraftType, partsStatus);
  };

  // Montaj verilerini güncelleme
  const updateMontajData = (aircraftType, partsStatus) => {
    const kanatPart = partsStatus.find(part => part.name === 'Kanat');
    const govdePart = partsStatus.find(part => part.name === 'Gövde');
    const kuyrukPart = partsStatus.find(part => part.name === 'Kuyruk');
    const aviyonikPart = partsStatus.find(part => part.name === 'Aviyonik');

    setMontajData({
      ucak_tipi: String(aircraftType.id),
      seri_no: `TST-UCK-${Math.floor(Math.random() * 1000)}`,
      kanat_parca_id: kanatPart && kanatPart.partId ? String(kanatPart.partId) : '',
      govde_parca_id: govdePart && govdePart.partId ? String(govdePart.partId) : '',
      kuyruk_parca_id: kuyrukPart && kuyrukPart.partId ? String(kuyrukPart.partId) : '',
      aviyonik_parca_id: aviyonikPart && aviyonikPart.partId ? String(aviyonikPart.partId) : '',
      notlar: ''
    });
  };

  // Montaj butonuna tıklandığında
  const handleMontajBaslat = () => {
    if (!selectedAircraftType) {
      toast.warning('Lütfen önce uçak tipi seçin.');
      return;
    }

    if (!checkAllPartsAvailable()) {
      toast.error('Eksik parçalar mevcut! Montaj yapılamaz.');
      return;
    }

    setShowModal(true);
  };

  // Montaj işlemini gerçekleştirme
  const handleAssemble = async () => {
    try {
      // Form verilerini doğru formatta hazırla
      const formattedData = {
        ucak_tipi: parseInt(montajData.ucak_tipi),
        seri_no: montajData.seri_no,
        kanat_parca_id: parseInt(montajData.kanat_parca_id) || null,
        govde_parca_id: parseInt(montajData.govde_parca_id) || null,
        kuyruk_parca_id: parseInt(montajData.kuyruk_parca_id) || null,
        aviyonik_parca_id: parseInt(montajData.aviyonik_parca_id) || null,
        notlar: montajData.notlar
      };

      console.log("📦 Gönderilen Montaj Verisi:", formattedData);

      const response = await apiClient.post(API.aircrafts.assemble, formattedData);

      toast.success('✅ Uçak başarıyla monte edildi!');
      setShowModal(false);

      // Verileri yeniden yükle
      const [aircraftsRes, assemblyStatusRes, inventoryRes] = await Promise.all([
        apiClient.get(API.aircrafts.list),
        apiClient.get(API.aircrafts.assemblyStatus),
        apiClient.get(API.inventory.list)
      ]);

      const aircraftData = aircraftsRes.data.results || aircraftsRes.data || [];
      setAircrafts(aircraftData);
      setAssemblyStatus(assemblyStatusRes.data || []);
      setInventory(inventoryRes.data.results || inventoryRes.data || []);

      // İstatistikleri güncelle
      prepareStatistics(aircraftData, aircraftTypes, assemblyStatusRes.data || []);

    } catch (err) {
      // Hata mesajlarını göster
      console.error("❌ API Hata Yanıtı:", err.response?.data || err);

      let errorMessage = "Montaj sırasında bir hata oluştu";
      if (err.response?.data) {
        if (err.response.data.detail) {
          errorMessage += `: ${err.response.data.detail}`;
        } else if (err.response.data.error) {
          errorMessage += `: ${err.response.data.error}`;
        } else if (typeof err.response.data === 'string') {
          errorMessage += `: ${err.response.data}`;
        }
      }

      toast.error(errorMessage);
    }
  };

  // Detay modalını aç
  const handleShowDetail = (aircraft) => {
    setSelectedAircraft(aircraft);
    setShowDetailModal(true);
  };

  // Tüm parçaların yeterli olup olmadığını kontrol et
  const checkAllPartsAvailable = () => {
    return requiredParts.every(part => part.status === 'Yeterli');
  };

  // Tarih formatı için yardımcı fonksiyon
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Bilinmiyor';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Geçersiz Tarih';
      return date.toLocaleString('tr-TR');
    } catch (e) {
      return 'Geçersiz Tarih';
    }
  };

  // Uçak tipinin adını ve kodunu getir
  const getAircraftTypeName = (typeId) => {
    const foundType = aircraftTypes.find(type => type.id === typeId);
    return foundType ? `${foundType.kod} - ${foundType.ad}` : 'Bilinmeyen Tip';
  };

  // Uçak için parça durumu özeti
  const getAircraftPartsStatus = (aircraft) => {
    // Parça bilgilerini topla
    const parts = [];
    if (aircraft.kanat_parca_id) parts.push(`Parça ${aircraft.kanat_parca_id}`);
    if (aircraft.govde_parca_id) parts.push(`Parça ${aircraft.govde_parca_id}`);
    if (aircraft.kuyruk_parca_id) parts.push(`Parça ${aircraft.kuyruk_parca_id}`);
    if (aircraft.aviyonik_parca_id) parts.push(`Parça ${aircraft.aviyonik_parca_id}`);

    return parts.length > 0 ? parts : ["Parça bilgisi yok"];
  };

  // Yükleme durumu göster
  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" size="lg" />
          <h5 className="mt-3">Veriler Yükleniyor...</h5>
          <p className="text-muted">Lütfen bekleyin, uçak ve parça bilgileri getiriliyor.</p>
        </div>
      </Container>
    );
  }

  // Hata durumu göster
  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <Alert.Heading>Bir Hata Oluştu</Alert.Heading>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button onClick={() => window.location.reload()} variant="outline-danger">
              Sayfayı Yenile
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={7}>
              <h2 className="mb-0">
                Montaj Takımı Kontrol Paneli
              </h2>
              <p className="text-muted">
                Uçak montaj işlemleri, parça yönetimi ve durum takibi
              </p>
            </Col>
            <Col md={5} className="text-end">
              <Row>
                <Col>
                  <div className="p-2 bg-primary text-white rounded">
                    <div className="h4 mb-0">{statsData.totalAircrafts}</div>
                    <div className="small">Monte Edilmiş Uçak</div>
                  </div>
                </Col>
                <Col>
                  <div className="p-2 bg-success text-white rounded">
                    <div className="h4 mb-0">{statsData.assemblyReady}</div>
                    <div className="small">Montaja Hazır Tip</div>
                  </div>
                </Col>
                <Col>
                  <div className="p-2 bg-warning text-white rounded">
                    <div className="h4 mb-0">{statsData.notReady}</div>
                    <div className="small">Eksik Parça Tip</div>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Ana Navigasyon */}
      <Nav variant="tabs" className="mb-4" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
        <Nav.Item>
          <Nav.Link eventKey="dashboard">
            Genel Durum
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="assembly">
            Montaj İşlemleri
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="completed">
            Tamamlanan Uçaklar
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {/* Tab İçerikleri */}
      <div className="tab-content">
        {/* Genel Durum */}
        {activeTab === "dashboard" && (
          <>
            <h4 className="mb-3 border-bottom pb-2">
              Uçak Tipi Durumları
            </h4>

            <Row className="mb-4">
              {aircraftTypes.map(type => {
                const status = assemblyStatus.find(s => s.ucak_tipi === type.kod);
                const isReady = status?.montaj_icin_yeterli;

                return (
                  <Col lg={4} md={6} key={type.id} className="mb-4">
                    <Card className="shadow-sm h-100">
                      <Card.Header className="d-flex justify-content-between">
                        <h5 className="mb-0">{type.kod}</h5>
                        <Badge bg={isReady ? 'success' : 'warning'}>
                          {isReady ? 'Montaja Hazır' : 'Eksik Parça'}
                        </Badge>
                      </Card.Header>
                      <Card.Body>
                        <h6>{type.ad}</h6>

                        <div className="mt-3 border-top pt-2">
                          <p className="text-muted mb-2">Parça Durumu:</p>
                          <div>
                            {status && status.eksik_parcalar && status.eksik_parcalar.length > 0 ? (
                              status.eksik_parcalar.map((part, idx) => (
                                <div key={idx} className="mb-1">
                                  <Badge bg="danger" className="me-2">Eksik</Badge>
                                  {part}
                                </div>
                              ))
                            ) : (
                              <div>
                                <Badge bg="success" className="me-2">Tamam</Badge>
                                Tüm parçalar mevcut
                              </div>
                            )}
                          </div>
                        </div>
                      </Card.Body>
                      <Card.Footer>
                        <Button
                          variant={isReady ? 'primary' : 'outline-secondary'}
                          className="w-100"
                          disabled={!isReady}
                          onClick={() => {
                            setSelectedAircraftType(type);
                            updateRequiredParts(type);
                            if (isReady) {
                              setActiveTab('assembly');
                              setTimeout(() => {
                                setShowModal(true);
                              }, 300);
                            } else {
                              toast.warning('Eksik parçalar mevcut! Montaj yapılamaz.');
                            }
                          }}
                        >
                          {isReady ? 'Montaj Yap' : 'Eksik Parça'}
                        </Button>
                      </Card.Footer>
                    </Card>
                  </Col>
                );
              })}
            </Row>

            {/* İstatistikler */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">
                  Montaj İstatistikleri
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <h6 className="mb-3">Uçak Tipine Göre Montaj Sayıları</h6>
                    <Table striped bordered hover size="sm">
                      <thead>
                        <tr>
                          <th>Uçak Tipi</th>
                          <th>Adı</th>
                          <th>Toplam Montaj</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(statsData.byType).map(([code, data]) => (
                          <tr key={code}>
                            <td>{code}</td>
                            <td>{data.name}</td>
                            <td>{data.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Col>
                  <Col md={6}>
                    <h6 className="mb-3">Genel Durum</h6>
                    <ListGroup variant="flush">
                      <ListGroup.Item className="d-flex justify-content-between align-items-center">
                        Toplam Monte Edilmiş Uçak
                        <Badge bg="primary" pill>{statsData.totalAircrafts}</Badge>
                      </ListGroup.Item>
                      <ListGroup.Item className="d-flex justify-content-between align-items-center">
                        Montaja Hazır Uçak Tipi
                        <Badge bg="success" pill>{statsData.assemblyReady}</Badge>
                      </ListGroup.Item>
                      <ListGroup.Item className="d-flex justify-content-between align-items-center">
                        Eksik Parçalı Uçak Tipi
                        <Badge bg="warning" pill>{statsData.notReady}</Badge>
                      </ListGroup.Item>
                      <ListGroup.Item className="d-flex justify-content-between align-items-center">
                        Toplam Uçak Tipi
                        <Badge bg="info" pill>{aircraftTypes.length}</Badge>
                      </ListGroup.Item>
                    </ListGroup>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </>
        )}

        {/* Montaj İşlemleri */}
        {activeTab === "assembly" && (
          <>
            <Card className="mb-4">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">
                  Uçak Montaj İşlemleri
                </h5>
              </Card.Header>
              <Card.Body>
                <Row className="align-items-end">
                  <Col md={8}>
                    <Form.Group className="mb-3">
                      <Form.Label>Uçak Tipi Seçin</Form.Label>
                      <Form.Select
                        onChange={handleAircraftTypeChange}
                        disabled={loading}
                      >
                        <option value="">Uçak Tipi Seçin</option>
                        {aircraftTypes.map(type => (
                          <option key={type.id} value={type.id}>
                            {type.kod || type.ad || `ID: ${type.id}`}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Button
                      variant="primary"
                      className="w-100"
                      onClick={handleMontajBaslat}
                      disabled={!selectedAircraftType || !checkAllPartsAvailable()}
                    >
                      Uçak Montajı Başlat
                    </Button>
                  </Col>
                </Row>

                {/* Seçilen uçak tipi için parça durumu tablosu */}
                {selectedAircraftType && (
                  <div className="mt-4">
                    <h5 className="mb-3">
                      {selectedAircraftType.kod || selectedAircraftType.ad} için Gerekli Parçalar
                    </h5>
                    <Table striped bordered hover responsive>
                      <thead className="bg-light">
                        <tr>
                          <th>Parça Tipi</th>
                          <th>Mevcut Adet</th>
                          <th>Gerekli Adet</th>
                          <th>Durum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requiredParts.map((part, index) => (
                          <tr key={index}>
                            <td>{part.name}</td>
                            <td>{part.available}</td>
                            <td>{part.required}</td>
                            <td>
                              <Badge bg={part.status === 'Yeterli' ? 'success' : 'danger'}>
                                {part.status === 'Yeterli' ? 'Yeterli' : 'Yetersiz'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>

                    {/* Parça durumu uyarısı */}
                    <Alert
                      variant={checkAllPartsAvailable() ? "success" : "warning"}
                      className="mt-3 d-flex align-items-center"
                    >
                      <div>
                        {checkAllPartsAvailable()
                          ? "Tüm parçalar mevcut! Montaj işlemine başlayabilirsiniz."
                          : "Eksik parçalar mevcut! Montaj için tüm parçaların temin edilmesi gerekiyor."}
                      </div>
                    </Alert>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Hızlı Erişim - Montaja Hazır Uçak Tipleri */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">
                  Montaja Hazır Uçak Tipleri
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  {aircraftTypes.filter(type => {
                    const status = assemblyStatus.find(s => s.ucak_tipi === type.kod);
                    return status?.montaj_icin_yeterli;
                  }).map(type => (
                    <Col md={3} sm={6} key={type.id} className="mb-3">
                      <Card className="h-100 border">
                        <Card.Body className="text-center">
                          <h6>{type.kod}</h6>
                          <p className="text-muted">{type.ad}</p>
                          <Badge bg="success" className="mb-3">Montaja Hazır</Badge>
                          <div>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="w-100"
                              onClick={() => {
                                setSelectedAircraftType(type);
                                updateRequiredParts(type);
                                setShowModal(true);
                              }}
                            >
                              Montaj Yap
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </>
        )}

        {/* Tamamlanan Uçaklar */}
        {activeTab === "completed" && (
          <>
            <Card className="mb-4">
              <Card.Header className="bg-success text-white">
                <h5 className="mb-0">
                  Montajı Tamamlanmış Uçaklar
                </h5>
              </Card.Header>
              <Card.Body>
                {aircrafts.length === 0 ? (
                  <Alert variant="info">
                    Henüz montajı tamamlanmış uçak bulunmamaktadır.
                  </Alert>
                ) : (
                  <Table responsive striped hover>
                    <thead className="bg-light">
                      <tr>
                        <th>ID</th>
                        <th>Uçak Tipi</th>
                        <th>Seri No</th>
                        <th>Durum</th>
                        <th>Montaj Tarihi</th>
                        <th>Parçalar</th>
                        <th>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aircrafts.map((aircraft) => {
                        // Uçak tipini bul
                        const aircraftType = aircraftTypes.find(t => t.id === aircraft.ucak_tipi);
                        const aircraftTypeName = aircraftType
                          ? `${aircraftType.kod} - ${aircraftType.ad}`
                          : (aircraft.ucak_tipi_adi || aircraft.ucak_tipi_kodu || `ID: ${aircraft.ucak_tipi}`);

                        // Parça bilgilerini al
                        const parts = getAircraftPartsStatus(aircraft);

                        return (
                          <tr key={aircraft.id}>
                            <td>{aircraft.id}</td>
                            <td>{aircraftTypeName}</td>
                            <td>{aircraft.seri_no}</td>
                            <td>
                              <Badge bg="info">
                                {aircraft.durum_adi || 'Tamamlandı'}
                              </Badge>
                            </td>
                            <td>{formatDate(aircraft.montaj_tarihi || aircraft.olusturulma_tarihi)}</td>
                            <td>
                              {parts.length > 0 && parts[0] !== "Parça bilgisi yok" ? (
                                <Badge bg="secondary" pill>
                                  {parts.length} Parça
                                </Badge>
                              ) : (
                                <span className="text-muted">Parça bilgisi yok</span>
                              )}
                            </td>
                            <td>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleShowDetail(aircraft)}
                              >
                                Detay
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>

            {/* Son Montaj Aktiviteleri */}
            <Card>
              <Card.Header>
                <h5 className="mb-0">
                  Son Montaj Aktiviteleri
                </h5>
              </Card.Header>
              <Card.Body>
                <Table striped hover size="sm">
                  <thead>
                    <tr>
                      <th>Tarih</th>
                      <th>Uçak Tipi</th>
                      <th>Seri No</th>
                      <th>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aircrafts.slice(0, 5).map((aircraft) => (
                      <tr key={`activity-${aircraft.id}`}>
                        <td>{formatDate(aircraft.montaj_tarihi || aircraft.olusturulma_tarihi)}</td>
                        <td>{aircraftTypes.find(t => t.id === aircraft.ucak_tipi)?.kod || '-'}</td>
                        <td>{aircraft.seri_no}</td>
                        <td>
                          <Badge bg="success">Montaj Tamamlandı</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </>
        )}
      </div>

      {/* Montaj Modalı */}
      <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static" size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            {selectedAircraftType ? `${selectedAircraftType.kod || ''} ${selectedAircraftType.ad || ''} Montajı` : 'Uçak Montajı'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3 p-3 bg-light rounded">
            <h6 className="mb-2">Uçak Bilgileri:</h6>
            <Row>
              <Col md={4}>
                <strong>Uçak Tipi:</strong> {selectedAircraftType ? (selectedAircraftType.kod) : ''}
              </Col>
              <Col md={8}>
                <strong>Model:</strong> {selectedAircraftType ? (selectedAircraftType.ad) : ''}
              </Col>
            </Row>
          </div>

          <h6 className="mb-3">Montaj için kullanılacak parçalar:</h6>
          <Table striped bordered hover size="sm" className="mb-4">
            <thead className="bg-light">
              <tr>
                <th>Parça Tipi</th>
                <th>Durum</th>
                <th>Parça ID</th>
              </tr>
            </thead>
            <tbody>
              {requiredParts.map((part, idx) => (
                <tr key={idx}>
                  <td>{part.name}</td>
                  <td>
                    <Badge bg={part.status === 'Yeterli' ? 'success' : 'danger'}>
                      {part.status}
                    </Badge>
                  </td>
                  <td>{part.partId || 'Belirtilmedi'}</td>
                </tr>
              ))}
            </tbody>
          </Table>

          <Alert variant="warning">
            Bu işlem sonucunda kullanılan parçalar stoktan düşülecektir.
          </Alert>

          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Seri Numarası <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                value={montajData.seri_no}
                onChange={(e) => setMontajData({...montajData, seri_no: e.target.value})}
                required
              />
              <Form.Text className="text-muted">
                Her uçak için benzersiz bir seri numarası girilmelidir.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Notlar</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={montajData.notlar}
                onChange={(e) => setMontajData({...montajData, notlar: e.target.value})}
                placeholder="Montaj ile ilgili ek bilgiler..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            İptal
          </Button>
          <Button
            variant="primary"
            onClick={handleAssemble}
            disabled={!montajData.seri_no || !checkAllPartsAvailable()}
          >
            Montajı Tamamla
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Uçak Detay Modalı */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
        <Modal.Header closeButton className="bg-info text-white">
          <Modal.Title>
            Uçak Detayları
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAircraft && (
            <>
              <Row className="mb-4">
                <Col md={6}>
                  <h5>{getAircraftTypeName(selectedAircraft.ucak_tipi)}</h5>
                  <p className="text-muted">Seri No: {selectedAircraft.seri_no}</p>
                </Col>
                <Col md={6} className="text-md-end">
                  <Badge bg="info" className="me-2">{selectedAircraft.durum_adi || 'Tamamlandı'}</Badge>
                  <p className="text-muted">{formatDate(selectedAircraft.montaj_tarihi || selectedAircraft.olusturulma_tarihi)}</p>
                </Col>
              </Row>

              <Accordion defaultActiveKey="0" className="mb-4">
                <Accordion.Item eventKey="0">
                  <Accordion.Header>Kullanılan Parçalar</Accordion.Header>
                  <Accordion.Body>
                    <Table striped bordered hover size="sm">
                      <thead>
                        <tr>
                          <th>Parça Tipi</th>
                          <th>Parça ID</th>
                          <th>Detay</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAircraft.kanat_parca_id && (
                          <tr>
                            <td>Kanat</td>
                            <td>{selectedAircraft.kanat_parca_id}</td>
                            <td>
                              <Badge bg="secondary">Montajda Kullanıldı</Badge>
                            </td>
                          </tr>
                        )}
                        {selectedAircraft.govde_parca_id && (
                          <tr>
                            <td>Gövde</td>
                            <td>{selectedAircraft.govde_parca_id}</td>
                            <td>
                              <Badge bg="secondary">Montajda Kullanıldı</Badge>
                            </td>
                          </tr>
                        )}
                        {selectedAircraft.kuyruk_parca_id && (
                          <tr>
                            <td>Kuyruk</td>
                            <td>{selectedAircraft.kuyruk_parca_id}</td>
                            <td>
                              <Badge bg="secondary">Montajda Kullanıldı</Badge>
                            </td>
                          </tr>
                        )}
                        {selectedAircraft.aviyonik_parca_id && (
                          <tr>
                            <td>Aviyonik</td>
                            <td>{selectedAircraft.aviyonik_parca_id}</td>
                            <td>
                              <Badge bg="secondary">Montajda Kullanıldı</Badge>
                            </td>
                          </tr>
                        )}
                        {!selectedAircraft.kanat_parca_id &&
                         !selectedAircraft.govde_parca_id &&
                         !selectedAircraft.kuyruk_parca_id &&
                         !selectedAircraft.aviyonik_parca_id && (
                          <tr>
                            <td colSpan={3} className="text-center">
                              <span className="text-muted">Parça bilgisi bulunamadı</span>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="1">
                  <Accordion.Header>Montaj Detayları</Accordion.Header>
                  <Accordion.Body>
                    <Row>
                      <Col md={6}>
                        <p><strong>Montaj Tarihi:</strong> {formatDate(selectedAircraft.montaj_tarihi || selectedAircraft.olusturulma_tarihi)}</p>
                        <p><strong>Montaj ID:</strong> {selectedAircraft.id}</p>
                      </Col>
                      <Col md={6}>
                        <p><strong>Uçak Tipi:</strong> {getAircraftTypeName(selectedAircraft.ucak_tipi)}</p>
                        <p><strong>Durum:</strong> {selectedAircraft.durum_adi || 'Tamamlandı'}</p>
                      </Col>
                    </Row>
                    <hr />
                    <div className="mt-3">
                      <h6>Açıklama / Notlar:</h6>
                      <p>{selectedAircraft.notlar || selectedAircraft.aciklama || 'Herhangi bir not bulunmamaktadır.'}</p>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Kapat
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MontajPage;