
import React, { useState, useEffect, useRef } from 'react';
import { Container, Card, Row, Col, Alert, Spinner, Accordion, ListGroup, Badge } from 'react-bootstrap';
import $ from 'jquery';
import 'datatables.net-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';
import 'datatables.net-responsive-bs5';
import { getTeams } from '../services/apiService';
import { toast } from 'react-toastify';

const TeamManagement = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedTeams, setExpandedTeams] = useState({});
  const tableRef = useRef(null);
  const dataTableRef = useRef(null);

  // Fetch teams data
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const data = await getTeams();
        setTeams(data);

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
        console.error('Error fetching teams:', error);
        setError('Takımlar yüklenirken bir hata oluştu.');
        toast.error('Takımlar yüklenirken bir hata oluştu.');
        setLoading(false);
      }
    };

    fetchTeams();

    // Cleanup DataTable when component unmounts
    return () => {
      if (dataTableRef.current) {
        dataTableRef.current.destroy();
        dataTableRef.current = null;
      }
    };
  }, []);

  // Toggle team expansion
  const toggleTeamExpansion = (teamId) => {
    setExpandedTeams(prev => ({
      ...prev,
      [teamId]: !prev[teamId]
    }));
  };

  // Get badge color for team type
  const getTeamTypeBadge = (teamType) => {
    const badgeColors = {
      'Kanat': 'primary',
      'Gövde': 'success',
      'Kuyruk': 'info',
      'Aviyonik': 'warning',
      'Montaj': 'danger'
    };

    return badgeColors[teamType] || 'secondary';
  };

  return (
    <Container className="teams-container">
      <h2 className="mb-4">Takım Yönetimi</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Team Summary Cards */}
      <Row className="mb-4">
        {loading ? (
          <Col>
            <div className="text-center py-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Yükleniyor...</span>
              </Spinner>
            </div>
          </Col>
        ) : (
          teams.map(team => (
            <Col key={team.id} md={6} lg={4} className="mb-3">
              <Card className="h-100">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <span>{team.name}</span>
                  <Badge bg={getTeamTypeBadge(team.takim_tipi)}>
                    {team.takim_tipi}
                  </Badge>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <strong>Açıklama:</strong> {team.aciklama || 'Açıklama yok'}
                  </div>

                  <div className="d-grid">
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => toggleTeamExpansion(team.id)}
                    >
                      {expandedTeams[team.id] ? 'Üyeleri Gizle' : 'Üyeleri Göster'}
                    </button>
                  </div>

                  {expandedTeams[team.id] && (
                    <div className="mt-3">
                      <h6>Takım Üyeleri:</h6>
                      {team.kullanicilar && team.kullanicilar.length > 0 ? (
                        <ListGroup variant="flush">
                          {team.kullanicilar.map(user => (
                            <ListGroup.Item key={user.id} className="px-0">
                              <div className="d-flex justify-content-between">
                                <div>{user.username}</div>
                                <small className="text-muted">{user.email || 'E-posta belirtilmemiş'}</small>
                              </div>
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      ) : (
                        <Alert variant="info" className="py-2">
                          Bu takımda henüz üye bulunmamaktadır.
                        </Alert>
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>

      {/* Team Statistics */}
      <Card>
        <Card.Header>Takım İstatistikleri</Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Yükleniyor...</span>
              </Spinner>
            </div>
          ) : (
            <>
              <Row className="mb-4">
                <Col md={4} className="mb-3">
                  <div className="border rounded p-3 text-center">
                    <h3>{teams.length}</h3>
                    <p className="mb-0">Toplam Takım</p>
                  </div>
                </Col>

                <Col md={4} className="mb-3">
                  <div className="border rounded p-3 text-center">
                    <h3>
                      {teams.reduce((total, team) =>
                        total + (team.kullanicilar ? team.kullanicilar.length : 0), 0
                      )}
                    </h3>
                    <p className="mb-0">Toplam Personel</p>
                  </div>
                </Col>

                <Col md={4} className="mb-3">
                  <div className="border rounded p-3 text-center">
                    <h3>
                      {teams.filter(team => team.takim_tipi === 'Montaj').length}
                    </h3>
                    <p className="mb-0">Montaj Takımları</p>
                  </div>
                </Col>
              </Row>

              <Accordion>
                <Accordion.Item eventKey="0">
                  <Accordion.Header>Takım Tipleri Dağılımı</Accordion.Header>
                  <Accordion.Body>
                    <div className="table-responsive">
                      <table className="table table-bordered">
                        <thead>
                          <tr>
                            <th>Takım Tipi</th>
                            <th>Takım Sayısı</th>
                            <th>Personel Sayısı</th>
                          </tr>
                        </thead>
                        <tbody>
                          {['Kanat', 'Gövde', 'Kuyruk', 'Aviyonik', 'Montaj'].map(type => {
                            const teamsOfType = teams.filter(team => team.takim_tipi === type);
                            const memberCount = teamsOfType.reduce((total, team) => {
                              return total + (team.kullanicilar ? team.kullanicilar.length : 0);
                            }, 0);

                            return (
                              <tr key={type}>
                                <td>
                                  <Badge bg={getTeamTypeBadge(type)} className="me-2">
                                    {type}
                                  </Badge>
                                </td>
                                <td>{teamsOfType.length}</td>
                                <td>{memberCount}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TeamManagement;