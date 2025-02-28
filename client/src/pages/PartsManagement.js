
import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form, Modal, Alert, Spinner } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import $ from 'jquery';
import 'datatables.net-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';
import 'datatables.net-responsive-bs5';
import { getParts, createPart, updatePart, recyclePartAPI, getPartTypes, getAircraftTypes, getUserTeams } from '../services/apiService';
import Swal from 'sweetalert2';

// Validation schema for part form
const partValidationSchema = Yup.object().shape({
  parca_tipi: Yup.number().required('Parça tipi seçilmelidir'),
  ucak_tipi: Yup.number().required('Uçak tipi seçilmelidir'),
  miktar: Yup.number()
    .required('Miktar gereklidir')
    .positive('Miktar pozitif olmalıdır')
    .integer('Miktar tam sayı olmalıdır')
});

const PartsManagement = ({ user }) => {
  const [parts, setParts] = useState([]);
  const [partTypes, setPartTypes] = useState([]);
  const [aircraftTypes, setAircraftTypes] = useState([]);
  const [userTeam, setUserTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentPart, setCurrentPart] = useState(null);
  const tableRef = useRef(null);
  const dataTableRef = useRef(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [partsData, partTypesData, aircraftTypesData, userTeamsData] = await Promise.all([
          getParts(),
          getPartTypes(),
          getAircraftTypes(),
          getUserTeams()
        ]);

        setParts(partsData);
        setPartTypes(partTypesData);
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
              }
            });
          }
          setLoading(false);
        }, 0);
      } catch (error) {
        console.error('Error fetching data:', error);
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

  // Handle form submission for creating/updating parts
  const handleSubmitPart = async (values, { setSubmitting, resetForm }) => {
    try {
      // Add team information to the part data
      const partData = {
        ...values,
        takim: userTeam ? userTeam.takim.id : null
      };

      let result;
      if (currentPart) {
        // Update existing part
        result = await updatePart(currentPart.id, partData);
        toast.success('Parça başarıyla güncellendi!');
      } else {
        // Create new part
        result = await createPart(partData);
        toast.success('Parça başarıyla oluşturuldu!');
      }

      setShowModal(false);
      resetForm();

      // Refresh parts list
      const updatedParts = await getParts();
      setParts(updatedParts);

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
            }
          });
        }
      }, 0);
    } catch (error) {
      console.error('Error submitting part:', error);
      let errorMessage = 'Parça kaydedilirken bir hata oluştu.';

      if (error.response && error.response.data) {
        // Extract error message from API response
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (typeof error.response.data === 'object') {
          const firstError = Object.values(error.response.data)[0];
          if (Array.isArray(firstError)) {
            errorMessage = firstError[0];
          } else if (typeof firstError === 'string') {
            errorMessage = firstError;
          }
        }
      }

      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle part recycling (deletion)
  const handleRecyclePart = async (partId) => {
    // Confirm recycling with SweetAlert2
    const result = await Swal.fire({
      title: 'Emin misiniz?',
      text: 'Bu parça geri dönüşüme gönderilecek.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Evet, geri dönüşüme gönder!',
      cancelButtonText: 'İptal'
    });

    if (result.isConfirmed) {
      try {
        await recyclePartAPI(partId);
        toast.success('Parça başarıyla geri dönüşüme gönderildi!');

        // Refresh parts list
        const updatedParts = await getParts();
        setParts(updatedParts);

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
              }
            });
          }
        }, 0);
      } catch (error) {
        console.error('Error recycling part:', error);
        toast.error('Parça geri dönüşüme gönderilirken bir hata oluştu.');
      }
    }
  };

  // Open modal for creating/editing a part
  const openPartModal = (part = null) => {
    setCurrentPart(part);
    setShowModal(true);
  };

  // Check if user can create parts based on team type
  const canCreateParts = () => {
    return userTeam && userTeam.takim.takim_tipi !== 'Montaj';
  };

  // Get the allowed part type ID based on user's team
  const getAllowedPartTypeId = () => {
    if (!userTeam || !partTypes.length) return '';

    const userTeamType = userTeam.takim.takim_tipi;
    const matchingPartType = partTypes.find(type => type.name === userTeamType);

    return matchingPartType ? matchingPartType.id : '';
  };

  return (
    <Container className="parts-container">
      <h2 className="mb-4">Parça Yönetimi</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span>Parça Listesi</span>
          {canCreateParts() && (
            <Button variant="primary" onClick={() => openPartModal()}>
              Yeni Parça Oluştur
            </Button>
          )}
        </Card.Header>
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
                    <th>Parça Tipi</th>
                    <th>Uçak Tipi</th>
                    <th>Miktar</th>
                    <th>Takım</th>
                    <th>Oluşturulma Tarihi</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {parts.length > 0 ? (
                    parts.map((part) => (
                      <tr key={part.id}>
                        <td>{part.id}</td>
                        <td>{part.parca_tipi ? part.parca_tipi.name : '-'}</td>
                        <td>{part.ucak_tipi ? part.ucak_tipi.name : '-'}</td>
                        <td>{part.miktar}</td>
                        <td>{part.takim ? part.takim.name : '-'}</td>
                        <td>{new Date(part.created_at).toLocaleDateString('tr-TR')}</td>
                        <td>
                          <Button
                            variant="warning"
                            size="sm"
                            className="me-2"
                            onClick={() => openPartModal(part)}
                          >
                            Düzenle
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleRecyclePart(part.id)}
                          >
                            Geri Dönüşüm
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center">
                        Henüz parça bulunmamaktadır.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Part Create/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>{currentPart ? 'Parça Düzenle' : 'Yeni Parça Oluştur'}</Modal.Title>
        </Modal.Header>
        <Formik
          initialValues={{
            parca_tipi: currentPart ? currentPart.parca_tipi.id : getAllowedPartTypeId(),
            ucak_tipi: currentPart ? currentPart.ucak_tipi.id : '',
            miktar: currentPart ? currentPart.miktar : 1
          }}
          validationSchema={partValidationSchema}
          onSubmit={handleSubmitPart}
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
              <Modal.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Parça Tipi</Form.Label>
                  <Form.Select
                    name="parca_tipi"
                    value={values.parca_tipi}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.parca_tipi && errors.parca_tipi}
                    disabled={getAllowedPartTypeId() !== ''}
                  >
                    <option value="">Seçiniz</option>
                    {partTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.parca_tipi}
                  </Form.Control.Feedback>
                  {getAllowedPartTypeId() !== '' && (
                    <Form.Text className="text-muted">
                      {userTeam.takim.takim_tipi} takımı olduğunuz için sadece bu tür parça üretebilirsiniz.
                    </Form.Text>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Uçak Tipi</Form.Label>
                  <Form.Select
                    name="ucak_tipi"
                    value={values.ucak_tipi}
                    onChange={handleChange}
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

                <Form.Group className="mb-3">
                  <Form.Label>Miktar</Form.Label>
                  <Form.Control
                    type="number"
                    name="miktar"
                    value={values.miktar}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.miktar && errors.miktar}
                    min="1"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.miktar}
                  </Form.Control.Feedback>
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  İptal
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Kaydediliyor...' : currentPart ? 'Güncelle' : 'Oluştur'}
                </Button>
              </Modal.Footer>
            </Form>
          )}
        </Formik>
      </Modal>
    </Container>
  );
};

export default PartsManagement;