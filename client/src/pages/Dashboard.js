
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';
import { getInventory, getAircraft, getUserTeams } from '../services/apiService';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [aircraft, setAircraft] = useState([]);
  const [userTeam, setUserTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user data including team
        const userData = await getCurrentUser();
        setUser(userData);

        // Get inventory and aircraft data
        const [inventoryData, aircraftData, userTeamsData] = await Promise.all([
          getInventory(),
          getAircraft(),
          getUserTeams()
        ]);

        setInventory(inventoryData);
        setAircraft(aircraftData);

        // Set user's team if available
        if (userTeamsData && userTeamsData.length > 0) {
          setUserTeam(userTeamsData[0]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Veriler yüklenirken bir hata oluştu.');
        toast.error('Veriler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter inventory by user's team type (if applicable)
  const getTeamStats = () => {
    if (!userTeam) return { total: 0, count: 0 };

    // Find parts relevant to user's team
    const teamParts = inventory.filter(item =>
      item.parca_tipi && item.parca_tipi.name &&
      item.parca_tipi.name.toLowerCase() === userTeam.takim.takim_tipi.toLowerCase()
    );

    return {
      total: teamParts.length,
      count: teamParts.reduce((sum, item) => sum + item.miktar, 0)
    };
  };

  const teamStats = getTeamStats();

  if (loading) {
    return (
      <Container className="dashboard-container">
        <div className="text-center py-5">
          <h3>Yükleniyor...</h3>
        </div>
      </Container>
    );
  }

  return (
    <Container className="dashboard-container">
      <h2 className="mb-4">Hava Aracı Üretim Sistemi</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row>
        {/* User Team Info Card */}
        <Col md={6} lg={4} className="mb-4">
          <Card className="dashboard-card h-100">
            <Card.Header>Takım Bilgileri</Card.Header>
            <Card.Body>
              {userTeam ? (
                <>
                  <h5>{userTeam.takim.name}</h5>
                  <p><strong>Takım Tipi:</strong> {userTeam.takim.takim_tipi}</p>
                  <p><strong>Üretilen Parça Sayısı:</strong> {teamStats.count}</p>
                  <p><strong>Parça Çeşidi:</strong> {teamStats.total}</p>
                  <Link to="/parts" className="btn btn-primary mt-2">Parça Yönetimi</Link>
                </>
              ) : (
                <Alert variant="warning">
                  Herhangi bir takıma atanmamışsınız.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Inventory Summary Card */}
        <Col md={6} lg={4} className="mb-4">
          <Card className="dashboard-card h-100">
            <Card.Header>Envanter Özeti</Card.Header>
            <Card.Body>
              <div className="mb-3">
                <h5>Toplam Parça: {inventory.reduce((sum, item) => sum + item.miktar, 0)}</h5>
                <p>Farklı Parça Çeşidi: {inventory.length}</p>
              </div>

              <div>
                <h6>Parça Türleri:</h6>
                <ul>
                  {['Kanat', 'Gövde', 'Kuyruk', 'Aviyonik'].map(type => {
                    const typeItems = inventory.filter(item =>
                      item.parca_tipi && item.parca_tipi.name &&
                      item.parca_tipi.name.toLowerCase() === type.toLowerCase()
                    );
                    const count = typeItems.reduce((sum, item) => sum + item.miktar, 0);

                    return (
                      <li key={type}>
                        {type}: {count} adet
                      </li>
                    );
                  })}
                </ul>
              </div>

              <Link to="/inventory" className="btn btn-info mt-2">Envanteri Görüntüle</Link>
            </Card.Body>
          </Card>
        </Col>

        {/* Aircraft Summary Card */}
        <Col md={6} lg={4} className="mb-4">
          <Card className="dashboard-card h-100">
            <Card.Header>Üretilen Uçaklar</Card.Header>
            <Card.Body>
              <h5>Toplam Üretilen Uçak: {aircraft.length}</h5>

              <div className="mt-3">
                <h6>Uçak Tipleri:</h6>
                {['TB2', 'TB3', 'AKINCI', 'KIZILELMA'].map(type => {
                  const count = aircraft.filter(a =>
                    a.ucak_tipi && a.ucak_tipi.name &&
                    a.ucak_tipi.name.toUpperCase() === type.toUpperCase()
                  ).length;

                  return (
                    <div key={type} className="mb-2">
                      <span>{type}: </span>
                      <span className="badge bg-primary">{count} adet</span>
                    </div>
                  );
                })}
              </div>

              <Link to="/assembly" className="btn btn-success mt-3">Uçak Montaj</Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Links Row */}
      <Row className="mt-2">
        <Col>
          <Card className="dashboard-card">
            <Card.Body>
              <h5>Hızlı Erişim</h5>
              <div className="d-flex flex-wrap gap-2 mt-3">
                <Link to="/parts" className="btn btn-outline-primary">Parça Yönetimi</Link>
                <Link to="/assembly" className="btn btn-outline-success">Uçak Montaj</Link>
                <Link to="/inventory" className="btn btn-outline-info">Envanter</Link>
                <Link to="/teams" className="btn btn-outline-secondary">Takımlar</Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;