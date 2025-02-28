import React, { useState, useEffect, useRef } from 'react';
import { Container, Card, Alert, Spinner, Badge, Button, ProgressBar, Modal, Form } from 'react-bootstrap';
import $ from 'jquery';
import 'datatables.net-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';
import 'datatables.net-responsive-bs5';
import 'datatables.net-buttons-bs5';
import 'datatables.net-buttons/js/buttons.html5.js';
import 'datatables.net-buttons/js/buttons.print.js';
import apiClient, { API } from '../services/apiConfig';
import { toast } from 'react-toastify';
import '../styles/TeamManagement.css';

const TeamManagement = ({ user }) => {
  const [teams, setTeams] = useState([]);
  const [userTeam, setUserTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [newMemberId, setNewMemberId] = useState('');
  const [newTeamData, setNewTeamData] = useState({
    ad: '',
    aciklama: '',
    montaj_yetkisi: false
  });
  const [editTeamData, setEditTeamData] = useState({
    id: null,
    ad: '',
    aciklama: '',
    montaj_yetkisi: false
});

  const tableRef = useRef(null);
  const dataTableRef = useRef(null);

  // Takımların alınması
  const getTeams = async () => {
    try {
      console.log('Takımlar alınıyor:', API.teams.list);
      const response = await apiClient.get(API.teams.list);
      console.log('Takımlar alındı:', response.data);
      return response.data;
    } catch (error) {
      console.error('Takımlar alınırken hata:', error);
      throw error;
    }
  };

  // Kullanıcı takımlarının alınması
  const getUserTeams = async () => {
    try {
      const response = await apiClient.get(API.teams.userTeams);
      return response.data;
    } catch (error) {
      console.error('Kullanıcı takımları alınırken hata:', error);
      throw error;
    }
  };

const getCsrfToken = () => {
    return document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1] || localStorage.getItem("csrftoken");
};

const createTeam = async (teamData) => {
    try {
        console.log("Takım Oluşturma API Çağrısı:", teamData);

        const csrfToken = getCsrfToken(); // CSRF token'ı al

        const response = await apiClient.post(API.teams.list, teamData, {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFTOKEN': csrfToken // CSRF Token'ı header'a ekle
            },
            withCredentials: true // CSRF token'ın çerezlerden gönderilmesini sağla
        });

        console.log("Takım başarıyla oluşturuldu:", response.data);
        return response.data;
    } catch (error) {
        console.error("Takım oluşturulurken hata oluştu:", error);

        if (error.response) {
            console.error("Hata Yanıtı:", error.response.data);
            toast.error(`Takım oluşturulamadı: ${error.response.data.detail || "Bilinmeyen hata"}`);
        } else {
            toast.error("Bağlantı hatası! API'ye ulaşılamıyor.");
        }

        throw error;
    }
};



  // Takım güncelleme
const updateTeam = async (teamId, teamData) => {
    try {
        const response = await apiClient.put(API.teams.detail(teamId), teamData, {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFTOKEN': 'urKMv988KGXLcvtLVuIhxU97JbMOwQcG' // CSRF token
            }
        });
        return response.data;
    } catch (error) {
        console.error('Takım güncellenirken hata:', error.response ? error.response.data : error);
        throw error;
    }
};


  // Takım silme
  const deleteTeam = async (teamId) => {
    try {
      await apiClient.delete(API.teams.detail(teamId));
      return true;
    } catch (error) {
      console.error('Takım silinirken hata:', error);
      throw error;
    }
  };

  // Takıma üye ekleme
const addUserToTeam = async (teamId, userId) => {
    try {
        console.log(`Takıma Üye Ekleniyor: KullanıcıID=${userId}, TakımID=${teamId}`);

        const csrfToken = getCsrfToken(); // CSRF token al

        const response = await apiClient.post(
            "http://localhost:8001/api/teams/kullanici-takimlar/",
            { kullanici: parseInt(userId), takim: parseInt(teamId) },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFTOKEN': csrfToken
                },
                withCredentials: true
            }
        );

        console.log("Kullanıcı başarıyla eklendi:", response.data);
        toast.success("Kullanıcı takıma başarıyla eklendi!");
        return response.data;
    } catch (error) {
        console.error('Takıma üye eklenirken hata oluştu:', error);

        if (error.response) {
            console.error("Yanıt Verisi:", error.response.data);
            toast.error(`Hata: ${error.response.data.kullanici || error.response.data.takim || "Bilinmeyen hata"}`);
        } else {
            toast.error("API'ye ulaşılamıyor, bağlantıyı kontrol et!");
        }
        throw error;
    }
};



  // Takımdan üye çıkarma
  const removeUserFromTeam = async (teamId, userId) => {
    try {
      const response = await apiClient.delete(API.teams.removeUser(teamId, userId));
      return response.data;
    } catch (error) {
      console.error('Takımdan kullanıcı çıkarılırken hata:', error);
      throw error;
    }
  };

  // Veri yükleme
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // API'den verileri al
        const [teamsData, userTeamsData] = await Promise.all([
          getTeams(),
          getUserTeams()
        ]);

        setTeams(teamsData || []);

        // Kullanıcının takımını ayarla (eğer varsa)
        if (userTeamsData && userTeamsData.length > 0) {
          // Backend'den gelen veri formatına göre kullanıcı takımını ayarla
          setUserTeam(userTeamsData[0]);
        }

        // DataTable'ı bir gecikmeyle başlat (DOM hazır olsun diye)
        setTimeout(() => {
          initializeDataTable();
          setLoading(false);
        }, 100);
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
        setError('Veriler yüklenirken bir hata oluştu.');
        toast.error('Veriler yüklenirken bir hata oluştu.');
        setLoading(false);
      }
    };

    fetchData();

    // Component unmount olduğunda DataTable'ı temizle
    return () => {
      if (dataTableRef.current) {
        dataTableRef.current.destroy();
        dataTableRef.current = null;
      }
    };
  }, []);

  // DataTable'ı başlat
  const initializeDataTable = () => {
    if (tableRef.current) {
      if (dataTableRef.current) {
        dataTableRef.current.destroy();
      }

      dataTableRef.current = $(tableRef.current).DataTable({
        responsive: true,
        language: {
          url: '//cdn.datatables.net/plug-ins/1.13.4/i18n/tr.json',
        },
        dom: 'Bfrtip',
        buttons: [
          {
            extend: 'excel',
            text: 'Excel\'e Aktar',
            className: 'btn btn-sm btn-success me-2',
            exportOptions: {
              columns: [0, 1, 2, 3]
            }
          },
          {
            extend: 'print',
            text: 'Yazdır',
            className: 'btn btn-sm btn-info',
            exportOptions: {
              columns: [0, 1, 2, 3]
            }
          }
        ],
        order: [[0, 'asc']]
      });
    }
  };

  // Yeni takım oluştur
const handleCreateTeam = async () => {
    if (!newTeamData.ad.trim()) {
        toast.warning("Takım adı boş olamaz!");
        return;
    }

    try {
        setLoading(true);
        await createTeam(newTeamData);
        toast.success("Takım başarıyla oluşturuldu!");
        setShowCreateTeamModal(false);

        // Takım listesini yenile
        const teamsData = await getTeams();
        setTeams(teamsData);

        // Formu sıfırla
        setNewTeamData({ ad: "", aciklama: "", montaj_yetkisi: false });

        // DataTable'ı yenile
        setTimeout(() => {
            initializeDataTable();
        }, 100);
    } catch (error) {
        console.error("Takım oluşturulurken hata:", error);
        toast.error("Takım oluşturulurken bir hata oluştu.");
    } finally {
        setLoading(false);
    }
};


  // Takım güncelleme
const handleUpdateTeam = async () => {
  try {
    setLoading(true);
    console.log('Güncellenecek Takım Bilgileri:', {
      id: editTeamData.id,
      ad: editTeamData.ad,
      aciklama: editTeamData.aciklama,
      montaj_yetkisi: editTeamData.montaj_yetkisi
    });

    await updateTeam(editTeamData.id, {
      ad: editTeamData.ad,
      aciklama: editTeamData.aciklama,
      montaj_yetkisi: editTeamData.montaj_yetkisi
    });

    toast.success('Takım başarıyla güncellendi');
    setShowEditTeamModal(false);

    // Takım listesini yenile
    const teamsData = await getTeams();
    setTeams(teamsData);

    // DataTable'ı yenile
    setTimeout(() => {
      initializeDataTable();
    }, 100);

    setLoading(false);
  } catch (error) {
    console.error('Detaylı Hata:', error);
    console.error('Hata Yanıtı:', error.response ? error.response.data : 'Yanıt yok');
    toast.error('Takım güncellenirken bir hata oluştu');
    setLoading(false);
  }
};

  // Takım silme
  const handleDeleteTeam = async () => {
    if (!selectedTeam) return;

    try {
      setLoading(true);
      await deleteTeam(selectedTeam.id);
      toast.success('Takım başarıyla silindi');
      setShowDeleteConfirmModal(false);

      // Takım listesini yenile
      const teamsData = await getTeams();
      setTeams(teamsData);

      // DataTable'ı yenile
      setTimeout(() => {
        initializeDataTable();
      }, 100);

      setLoading(false);
    } catch (error) {
      console.error('Takım silinirken hata:', error);
      toast.error('Takım silinirken bir hata oluştu');
      setLoading(false);
    }
  };

  // Üye ekleme
const handleAddMember = async () => {
    if (!selectedTeam || !newMemberId.trim()) {
        toast.warning("Lütfen geçerli bir takım ve kullanıcı ID'si girin!");
        return;
    }

    try {
        setLoading(true);
        console.log(`Takıma Üye Ekleniyor: KullanıcıID=${newMemberId}, TakımID=${selectedTeam.id}`);

        const csrfToken = getCsrfToken(); // CSRF token al

        const response = await apiClient.post(
            "http://localhost:8001/api/teams/kullanici-takimlar/",
            {
                kullanici: parseInt(newMemberId), // Kullanıcı ID'yi integer olarak gönder
                takim: parseInt(selectedTeam.id) // Takım ID'yi integer olarak gönder
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFTOKEN': csrfToken
                },
                withCredentials: true
            }
        );

        console.log("Kullanıcı başarıyla eklendi:", response.data);
        toast.success("Kullanıcı takıma başarıyla eklendi!");

        // Modalı kapat ve formu sıfırla
        setShowAddMemberModal(false);
        setNewMemberId('');

        // Takım listesini yenile
        const teamsData = await getTeams();
        setTeams(teamsData);
    } catch (error) {
        console.error('Kullanıcı eklenirken hata:', error);

        if (error.response) {
            toast.error(`Hata: ${error.response.data.kullanici || error.response.data.takim || "Bilinmeyen hata"}`);
        } else {
            toast.error("API bağlantı hatası! Sunucuya ulaşılamıyor.");
        }
    } finally {
        setLoading(false);
    }
};




  // Düzenleme modülünü aç
  const openEditModal = (team) => {
    setEditTeamData({
      id: team.id,
      ad: team.ad,
      aciklama: team.aciklama || '',
      montaj_yetkisi: team.montaj_yetkisi
    });
    setShowEditTeamModal(true);
  };

  // Silme onay modülünü aç
  const openDeleteModal = (team) => {
    setSelectedTeam(team);
    setShowDeleteConfirmModal(true);
  };

  // Üye ekleme modülünü aç
  const openAddMemberModal = (team) => {
    setSelectedTeam(team);
    setShowAddMemberModal(true);
  };

  // Takım tipi için rozet rengi
  const getTeamTypeBadge = (hasMontajYetkisi) => {
    return hasMontajYetkisi ? 'success' : 'primary';
  };

  // Yükleme durumu
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner">
            <Spinner animation="border" variant="primary" />
          </div>
          <h4 className="mt-3">Takım Bilgileri Yükleniyor</h4>
          <ProgressBar animated now={100} className="mt-3" />
        </div>
      </div>
    );
  }

  return (
    <Container fluid className="team-management-container py-4">
      <div className="page-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="page-title">Takım Yönetimi</h2>
            <p className="text-muted">
              {userTeam ? (
                <>Mevcut Takımınız: <Badge bg="primary" className="ms-1">{userTeam.takim}</Badge></>
              ) : (
                'Henüz bir takıma atanmamışsınız.'
              )}
            </p>
          </div>
          <div>
            <Button
              variant="primary"
              className="add-team-btn"
              onClick={() => setShowCreateTeamModal(true)}
            >
              <i className="bi bi-plus-circle me-1"></i>
              Yeni Takım Oluştur
            </Button>
          </div>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Takım Listesi */}
      <Card className="mb-4">
        <Card.Header>
          <strong>Takım Listesi</strong>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <table ref={tableRef} className="table table-striped team-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Takım Adı</th>
                  <th>Açıklama</th>
                  <th>Montaj Yetkisi</th>
                  <th>Üye Sayısı</th>
                  <th>Oluşturma Tarihi</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {teams.map(team => (
                  <tr key={team.id}>
                    <td>{team.id}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className={`team-icon-badge small bg-${getTeamTypeBadge(team.montaj_yetkisi)}`}>
                          <i className="bi bi-people-fill"></i>
                        </div>
                        <span className="ms-2">{team.ad}</span>
                      </div>
                    </td>
                    <td>{team.aciklama || '-'}</td>
                    <td>
                      <Badge bg={team.montaj_yetkisi ? 'success' : 'secondary'}>
                        {team.montaj_yetkisi ? 'Var' : 'Yok'}
                      </Badge>
                    </td>
                    <td>
                      {team.uyeler ? team.uyeler.length : 0} kişi
                    </td>
                    <td>{new Date(team.olusturma_tarihi).toLocaleString('tr-TR')}</td>
                    <td>
                      <div className="btn-group">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-1"
                          onClick={() => openEditModal(team)}
                        >
                          <i className="bi bi-pencil-fill"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="me-1"
                          onClick={() => openDeleteModal(team)}
                        >
                          <i className="bi bi-trash-fill"></i>
                        </Button>
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => openAddMemberModal(team)}
                        >
                          <i className="bi bi-person-plus-fill"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>

      {/* Yeni Takım Oluşturma Modal */}
      <Modal
        show={showCreateTeamModal}
        onHide={() => setShowCreateTeamModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Yeni Takım Oluştur</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Takım Adı</Form.Label>
              <Form.Control
                type="text"
                placeholder="Takım adını giriniz"
                value={newTeamData.ad}
                onChange={(e) => setNewTeamData({...newTeamData, ad: e.target.value})}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Açıklama</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Takım açıklaması giriniz"
                value={newTeamData.aciklama}
                onChange={(e) => setNewTeamData({...newTeamData, aciklama: e.target.value})}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Montaj Yetkisi"
                checked={newTeamData.montaj_yetkisi}
                onChange={(e) => setNewTeamData({...newTeamData, montaj_yetkisi: e.target.checked})}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateTeamModal(false)}>
            İptal
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateTeam}
            disabled={!newTeamData.ad || loading}
          >
            {loading ? <><Spinner animation="border" size="sm" /> Oluşturuluyor...</> : 'Oluştur'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Takım Düzenleme Modal */}
      <Modal
        show={showEditTeamModal}
        onHide={() => setShowEditTeamModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Takım Düzenle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Takım Adı</Form.Label>
              <Form.Control
                type="text"
                placeholder="Takım adını giriniz"
                value={editTeamData.ad}
                onChange={(e) => setEditTeamData({...editTeamData, ad: e.target.value})}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Açıklama</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Takım açıklaması giriniz"
                value={editTeamData.aciklama}
                onChange={(e) => setEditTeamData({...editTeamData, aciklama: e.target.value})}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Montaj Yetkisi"
                checked={editTeamData.montaj_yetkisi}
                onChange={(e) => setEditTeamData({...editTeamData, montaj_yetkisi: e.target.checked})}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditTeamModal(false)}>
            İptal
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdateTeam}
            disabled={!editTeamData.ad || loading}
          >
            {loading ? <><Spinner animation="border" size="sm" /> Güncelleniyor...</> : 'Güncelle'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Takım Silme Onay Modal */}
      <Modal
        show={showDeleteConfirmModal}
        onHide={() => setShowDeleteConfirmModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Takım Silme Onayı</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            <strong>{selectedTeam?.ad}</strong> takımını silmek istediğinizden emin misiniz?
            Bu işlem geri alınamaz ve takımın tüm üyeleri takımdan çıkarılacaktır.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirmModal(false)}>
            İptal
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteTeam}
            disabled={loading}
          >
            {loading ? <><Spinner animation="border" size="sm" /> Siliniyor...</> : 'Sil'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Üye Ekleme Modal */}
      <Modal
        show={showAddMemberModal}
        onHide={() => setShowAddMemberModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Takıma Üye Ekle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Kullanıcı ID</Form.Label>
              <Form.Control
                type="text"
                placeholder="Kullanıcı ID'sini giriniz"
                value={newMemberId}
                onChange={(e) => setNewMemberId(e.target.value)}
              />
              <Form.Text className="text-muted">
                Eklemek istediğiniz kullanıcının ID'sini giriniz.
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddMemberModal(false)}>
            İptal
          </Button>
          <Button
            variant="primary"
            onClick={handleAddMember}
            disabled={!newMemberId || loading}
          >
            {loading ? <><Spinner animation="border" size="sm" /> Ekleniyor...</> : 'Ekle'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TeamManagement;