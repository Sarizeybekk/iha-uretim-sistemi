
import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Container, Button, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../services/authService';
import { toast } from 'react-toastify';

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Çıkış yapılamadı:', error);
    }
  };

  return (
    <BootstrapNavbar bg="dark" variant="dark" expand="lg" className="mb-4 py-2 shadow-sm">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <i className="bi bi-airplane me-2"></i>
          <span className="fw-bold">Hava Aracı Üretim Sistemi</span>
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="navbar-nav" />
        <BootstrapNavbar.Collapse id="navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/" className="px-3">
              <i className="bi bi-house-door me-1"></i> Ana Sayfa
            </Nav.Link>
            <Nav.Link as={Link} to="/parts" className="px-3">
              <i className="bi bi-gear me-1"></i> Parça Yönetimi
            </Nav.Link>
            <Nav.Link as={Link} to="/assembly" className="px-3">
              <i className="bi bi-tools me-1"></i> Uçak Montajı
            </Nav.Link>
            <Nav.Link as={Link} to="/inventory" className="px-3">
              <i className="bi bi-box me-1"></i> Envanter
            </Nav.Link>

          </Nav>
          <Nav>
            {user && (
              <Dropdown align="end">
                <Dropdown.Toggle variant="dark" id="user-dropdown" className="d-flex align-items-center">
                  <i className="bi bi-person-circle me-2"></i>
                  <span>{user.username}</span>
                </Dropdown.Toggle>
                <Dropdown.Menu className="shadow">
                  <Dropdown.Item disabled className="text-muted">
                    <small>
                      {user.team ? (
                        <><i className="bi bi-people-fill me-1"></i> {user.team.name}</>
                      ) : (
                        <><i className="bi bi-exclamation-circle me-1"></i> Takım Atanmamış</>
                      )}
                    </small>
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item as={Link} to="/profile">
                    <i className="bi bi-person me-2"></i> Profil
                  </Dropdown.Item>
                  <Dropdown.Item onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i> Çıkış Yap
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;