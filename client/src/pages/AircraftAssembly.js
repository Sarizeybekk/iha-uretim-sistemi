
import React, { useState, useEffect, useRef } from 'react';
import { Container, Card, Row, Col, Form, Button, Alert, Spinner, Table } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import $ from 'jquery';
import 'datatables.net-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';
import 'datatables.net-responsive-bs5';
import { getAircraft, checkMissingParts, assembleAircraft, deliverAircraft, getAircraftTypes, getUserTeams } from '../services/apiService';

// Validation schema for aircraft assembly
const assemblyValidationSchema = Yup.object().shape({
  ucak_tipi: Yup.number().required('Uçak tipi seçilmelidir')
});

const AircraftAssembly = ({ user }) => {
  const [aircraft, setAircraft] = useState([]);
  const [aircraftTypes, setAircraftTypes] = useState([]);
  const [missingPartsCheck, setMissingPartsCheck] = useState(null);
  const [userTeam, setUserTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assembling, setAssembling] = useState(false);
  const [error, setError] = useState('');
  const tableRef = useRef(null);
  const dataTableRef = useRef(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [aircraftData, aircraftTypesData, userTeamsData] = await Promise.all([
          getAircraft(),
          getAircraftTypes(),
          getUserTeams()
        ]);

        setAircraft(aircraftData);
        setAircraftTypes(aircraftTypesData);

        // Set user's team if available
        if (userTeamsData && userTeamsData.length > 0) {
          setUserTeam(userTeamsData[0]);
        }

        // Initialize DataTable
        setTimeout(() => {
          if (tableRef.current) {
            if (dataTableRef.current) {
              dataTableRef.current.destroy();
            }

            dataTableRef.current = $(tableRef.current).DataTable({
              responsive: true,
              language: {
                url: '//cdn.datatables.net/plug-ins/1.13.4/i18n/tr.json',
              },
              order: [[0, 'desc']]
            });
          }
          setLoading(false);
        }, 0);
      } catch (error) {
        console.error('Error fetching aircraft data:', error);
        setError('Veriler yüklenirken bir hata oluştu.');
        toast.error('Veriler yüklenirken bir hata oluştu.');
        setLoading(false);
      }
    };

    fetchData();

    // Cleanup DataTable when component unmounts
    return () => {
      if (dataTableRef.current) {
        dataTableRef.current.destroy();
        dataTableRef.current = null;
      }
    };
  }, []);

  // Check if user is in assembly team
  const isAssemblyTeam = userTeam && userTeam.takim.takim_tipi === 'Montaj';

  // Check part availability for selected aircraft type
  const handleCheckMissingParts = async (aircraftTypeId) => {
    try {
      setMissingPartsCheck(null);
      if (!aircraftTypeId) return;

      // Find aircraft type name from the selected ID
      const selectedAircraftType = aircraftTypes.find(type => type.id === parseInt(aircraftTypeId));
      if (!selectedAircraftType) return;

      const missingPartsData = await checkMissingParts(selectedAircraftType.name);
      setMissingPartsCheck(missingPartsData);
    } catch (error) {
      console.error('Error checking missing parts:', error);
      toast.error('Parça uygunluğu kontrol edilirken bir hata oluştu.');
    }
  };

  // Handle aircraft assembly
  const handleAssembleAircraft = async (values, { setSubmitting, resetForm }) => {
    try {
      setAssembling(true);

      // First check missing parts
      const selectedAircraftType = aircraftTypes.find(type => type.id === parseInt(values.ucak_tipi));
      if (!selectedAircraftType) {
        toast.error('Geçersiz uçak tipi seçildi.');
        return;
      }

      const missingPartsData = await checkMissingParts(selectedAircraftType.name);

      // Check if all parts are available
      if (missingPartsData.eksik_parcalar && missingPartsData.eksik_parcalar.length > 0) {
        setMissingPartsCheck(missingPartsData);
        toast.error('Eksik parçalar var, uçak montajı yapılamaz!');
        return;
      }

      // Create and assemble aircraft
      const newAircraft = await assembleAircraft({
        ucak_tipi: values.ucak_tipi,
        takim: userTeam.takim.id
      });

      toast.success(`${selectedAircraftType.name} uçağı başarıyla monte edildi!`);
      resetForm();
      setMissingPartsCheck(null);

      // Refresh aircraft list
      const updatedAircraft = await getAircraft();
      setAircraft(updatedAircraft);

      // Refresh DataTable
      if (dataTableRef.current) {
        dataTableRef.current.destroy();
      }

      setTimeout(() => {
        if (tableRef.current) {
          dataTableRef.current = $(tableRef.current).DataTable({
            responsive: true,
            language: {
              url: '//cdn.datatables.net/plug-ins/1.13.4/i18n/tr.json',
            },
            order: [[0, 'desc']]
          });
        }
      }, 0);
    } catch (error) {
      console.error('Error assembling aircraft:', error);
      let errorMessage = 'Uçak montajı sırasında bir hata oluştu.';

      if (error.response && error.response.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        }
      }

      toast.error(errorMessage);
    } finally {
      setAssembling(false);
      setSubmitting(false);
    }
  };

  // Handle aircraft delivery
  const handleDeliverAircraft = async (aircraftId) => {
    try {
        // src/pages/AircraftAssembly.js (devamı)
      await deliverAircraft(aircraftId);
      toast.success('Uçak başarıyla teslim edildi!');

      // Refresh aircraft list
      const updatedAircraft = await getAircraft();
      setAircraft(updatedAircraft);

      // Refresh DataTable
      if (dataTableRef.current) {
        dataTableRef.current.destroy();
      }

      setTimeout(() => {
        if (tableRef.current) {
          dataTableRef.current = $(tableRef.current).DataTable({
            responsive: true,
            language: {
              url: '//cdn.datatables.net/plug-ins/1.13.4/i18n/tr.json',
            },
            order: [[0, 'desc']]
          });
        }
      }, 0);
    } catch (error) {
      console.error('Error delivering aircraft:', error);
      toast.error('Uçak teslim edilirken bir hata oluştu.');
    }
  };

  return (
    <Container className="assembly-container">
      <h2 className="mb-4">Uçak Montajı</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Assembly Form for Assembly Team */}
      {isAssemblyTeam ? (
        <Card className="mb-4">
          <Card.Header>Uçak Montaj Formu</Card.Header>
          <Card.Body>
            <Formik
              initialValues={{ ucak_tipi: '' }}
              validationSchema={assemblyValidationSchema}
              onSubmit={handleAssembleAircraft}
            >
              {({
                values,
                errors,
                touched,
                handleChange,
                handleBlur,
                handleSubmit,
                isSubmitting,
                setFieldValue
              }) => (
                <Form onSubmit={handleSubmit}>
                  <Row className="align-items-end">
                    <Col sm={12} md={6} lg={4} className="mb-3">
                      <Form.Group>
                        <Form.Label>Uçak Tipi</Form.Label>
                        <Form.Select
                          name="ucak_tipi"
                          value={values.ucak_tipi}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFieldValue('ucak_tipi', value);
                            if (value) {
                              handleCheckMissingParts(value);
                            }
                          }}
                          onBlur={handleBlur}
                          isInvalid={touched.ucak_tipi && errors.ucak_tipi}
                        >
                          <option value="">Seçiniz</option>
                          {aircraftTypes.map(type => (
                            <option key={type.id} value={type.id}>
                              {type.name}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {errors.ucak_tipi}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col sm={12} md={6} lg={3} className="mb-3">
                      <Button
                        variant="primary"
                        type="button"
                        className="me-2"
                        onClick={() => handleCheckMissingParts(values.ucak_tipi)}
                        disabled={!values.ucak_tipi}
                      >
                        Parça Kontrol Et
                      </Button>
                      <Button
                        variant="success"
                        type="submit"
                        disabled={isSubmitting || assembling || !values.ucak_tipi}
                      >
                        {assembling ? 'Montaj Yapılıyor...' : 'Montaj Yap'}
                      </Button>
                    </Col>
                  </Row>
                </Form>
              )}
            </Formik>

            {/* Missing Parts Check Results */}
            {missingPartsCheck && (
              <div className="mt-4">
                <h5>Parça Kontrol Sonuçları: {missingPartsCheck.ucak_tipi}</h5>

                {missingPartsCheck.eksik_parcalar && missingPartsCheck.eksik_parcalar.length === 0 ? (
                  <Alert variant="success">
                    Tüm parçalar mevcut! Uçak montajı yapılabilir.
                  </Alert>
                ) : (
                  <Alert variant="warning">
                    Eksik parçalar var! Uçak montajı yapılamaz.
                  </Alert>
                )}

                <Table striped bordered hover className="mt-3">
                  <thead>
                    <tr>
                      <th>Parça Tipi</th>
                      <th>Durum</th>
                      <th>Mevcut</th>
                      <th>Gerekli</th>
                    </tr>
                  </thead>
                  <tbody>
                    {missingPartsCheck.parca_durumu && Object.entries(missingPartsCheck.parca_durumu).map(([partType, detail]) => (
                      <tr key={partType}>
                        <td>{partType}</td>
                        <td>
                          {detail.yeterli ? (
                            <span className="text-success">✓ Mevcut</span>
                          ) : (
                            <span className="text-danger">✗ Eksik</span>
                          )}
                        </td>
                        <td>{detail.mevcut_miktar}</td>
                        <td>{detail.gerekli_miktar}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      ) : (
        <Alert variant="info" className="mb-4">
          Uçak montajı sadece Montaj takımı tarafından yapılabilir.
        </Alert>
      )}

      {/* Assembled Aircraft List */}
      <Card>
        <Card.Header>Üretilen Uçaklar</Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Yükleniyor...</span>
              </Spinner>
            </div>
          ) : (
            <div className="table-responsive">
              <table ref={tableRef} className="table table-striped table-bordered dt-responsive nowrap">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Uçak Tipi</th>
                    <th>Montaj Takımı</th>
                    <th>Durum</th>
                    <th>Üretim Tarihi</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {aircraft.length > 0 ? (
                    aircraft.map((plane) => (
                      <tr key={plane.id}>
                        <td>{plane.id}</td>
                        <td>{plane.ucak_tipi ? plane.ucak_tipi.name : '-'}</td>
                        <td>{plane.takim ? plane.takim.name : 'Belirtilmemiş'}</td>
                        <td>
                          <span className={`badge bg-${plane.durum === 'Teslim Edildi' ? 'success' : 'primary'}`}>
                            {plane.durum}
                          </span>
                        </td>
                        <td>{new Date(plane.created_at).toLocaleDateString('tr-TR')}</td>
                        <td>
                          {plane.durum !== 'Teslim Edildi' && isAssemblyTeam && (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleDeliverAircraft(plane.id)}
                            >
                              Teslim Et
                            </Button>
                          )}
                          <Button
                            variant="info"
                            size="sm"
                            className={plane.durum !== 'Teslim Edildi' && isAssemblyTeam ? 'ms-2' : ''}
                            onClick={() => {
                              // Show parts used in this aircraft as a toast notification
                              let partsMessage = '';
                              if (plane.parcalar && plane.parcalar.length > 0) {
                                partsMessage = plane.parcalar
                                  .map(part => `${part.parca_tipi.name} (ID: ${part.id})`)
                                  .join(', ');
                              } else {
                                partsMessage = 'Parça bilgisi bulunamadı';
                              }
                              toast.info(
                                <div>
                                  <h6>{plane.ucak_tipi.name} - Kullanılan Parçalar:</h6>
                                  <p>{partsMessage}</p>
                                </div>,
                                { autoClose: 5000 }
                              );
                            }}
                          >
                            Detayları Göster
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center">
                        Henüz üretilen uçak bulunmamaktadır.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AircraftAssembly;
