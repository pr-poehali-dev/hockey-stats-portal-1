import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import Icon from '@/components/ui/icon'
import { useToast } from '@/hooks/use-toast'

interface Team {
  id: number
  name: string
  logo_url: string | null
  games_played: number
  wins: number
  losses: number
  ot_losses: number
  goals_for: number
  goals_against: number
  position: number
}

const Index = () => {
  const [teams, setTeams] = useState<Team[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [password, setPassword] = useState('')
  const [showLogin, setShowLogin] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [isAddingTeam, setIsAddingTeam] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const { toast } = useToast()

  const [teamForm, setTeamForm] = useState({
    name: '',
    games_played: 0,
    wins: 0,
    losses: 0,
    ot_losses: 0,
    goals_for: 0,
    goals_against: 0
  })

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    const response = await fetch('https://functions.poehali.dev/f3fea51f-f986-4900-8ee6-811a724c6d74')
    const data = await response.json()
    setTeams(data)
  }

  const handleLogin = () => {
    if (password === 'ihlpuck1337') {
      setIsAdmin(true)
      setShowLogin(false)
      toast({ title: 'Вход выполнен', description: 'Добро пожаловать в админ-панель' })
    } else {
      toast({ title: 'Ошибка', description: 'Неверный пароль', variant: 'destructive' })
    }
  }

  const handleLogout = () => {
    setIsAdmin(false)
    setPassword('')
    toast({ title: 'Выход выполнен' })
  }

  const calculatePoints = (wins: number, otLosses: number) => {
    return wins * 2 + otLosses
  }

  const handleSaveTeam = async () => {
    let logoUrl = editingTeam?.logo_url || null

    if (logoFile) {
      const formData = new FormData()
      formData.append('file', logoFile)
      const uploadResponse = await fetch('https://functions.poehali.dev/a2983ee7-6ba5-43e6-ae22-4126f26e3971', {
        method: 'POST',
        body: formData
      })
      const uploadData = await uploadResponse.json()
      logoUrl = uploadData.url
    }

    const teamData = {
      ...teamForm,
      logo_url: logoUrl,
      position: editingTeam ? editingTeam.position : teams.length
    }

    if (editingTeam) {
      await fetch(`https://functions.poehali.dev/f3fea51f-f986-4900-8ee6-811a724c6d74/${editingTeam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamData)
      })
      toast({ title: 'Команда обновлена' })
    } else {
      await fetch('https://functions.poehali.dev/f3fea51f-f986-4900-8ee6-811a724c6d74', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamData)
      })
      toast({ title: 'Команда добавлена' })
    }

    fetchTeams()
    setEditingTeam(null)
    setIsAddingTeam(false)
    setLogoFile(null)
    setTeamForm({
      name: '',
      games_played: 0,
      wins: 0,
      losses: 0,
      ot_losses: 0,
      goals_for: 0,
      goals_against: 0
    })
  }

  const handleDeleteTeam = async (id: number) => {
    await fetch(`https://functions.poehali.dev/f3fea51f-f986-4900-8ee6-811a724c6d74/${id}`, { method: 'DELETE' })
    toast({ title: 'Команда удалена' })
    fetchTeams()
  }

  const handleMoveTeam = async (id: number, direction: 'up' | 'down') => {
    const currentIndex = teams.findIndex(t => t.id === id)
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    
    if (newIndex < 0 || newIndex >= teams.length) return

    const newTeams = [...teams]
    const temp = newTeams[currentIndex]
    newTeams[currentIndex] = newTeams[newIndex]
    newTeams[newIndex] = temp

    for (let i = 0; i < newTeams.length; i++) {
      await fetch(`https://functions.poehali.dev/f3fea51f-f986-4900-8ee6-811a724c6d74/${newTeams[i].id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newTeams[i], position: i })
      })
    }

    fetchTeams()
  }

  const openEditDialog = (team: Team) => {
    setEditingTeam(team)
    setTeamForm({
      name: team.name,
      games_played: team.games_played,
      wins: team.wins,
      losses: team.losses,
      ot_losses: team.ot_losses,
      goals_for: team.goals_for,
      goals_against: team.goals_against
    })
    setLogoFile(null)
  }

  const openAddDialog = () => {
    setIsAddingTeam(true)
    setEditingTeam(null)
    setTeamForm({
      name: '',
      games_played: 0,
      wins: 0,
      losses: 0,
      ot_losses: 0,
      goals_for: 0,
      goals_against: 0
    })
    setLogoFile(null)
  }

  const sortedTeams = [...teams].sort((a, b) => a.position - b.position)

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-6 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-5xl">🏒</div>
              <h1 className="text-4xl font-black tracking-tight">IHL</h1>
            </div>
            <div>
              {isAdmin ? (
                <Button onClick={handleLogout} variant="secondary" size="sm">
                  <Icon name="LogOut" className="mr-2" size={16} />
                  Выйти
                </Button>
              ) : (
                <Button onClick={() => setShowLogin(true)} variant="secondary" size="sm">
                  <Icon name="Lock" className="mr-2" size={16} />
                  Админ
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-foreground">Турнирная таблица</h2>
          {isAdmin && (
            <Button onClick={openAddDialog} className="bg-accent hover:bg-accent/90">
              <Icon name="Plus" className="mr-2" size={18} />
              Добавить команду
            </Button>
          )}
        </div>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12 font-bold">#</TableHead>
                <TableHead className="font-bold">Команда</TableHead>
                <TableHead className="text-center font-bold">И</TableHead>
                <TableHead className="text-center font-bold">В</TableHead>
                <TableHead className="text-center font-bold">П</TableHead>
                <TableHead className="text-center font-bold">ПО</TableHead>
                <TableHead className="text-center font-bold">ЗШ</TableHead>
                <TableHead className="text-center font-bold">ПШ</TableHead>
                <TableHead className="text-center font-bold">+/-</TableHead>
                <TableHead className="text-center font-bold">О</TableHead>
                {isAdmin && <TableHead className="text-right font-bold">Действия</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTeams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 11 : 10} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <Icon name="Table" size={48} className="opacity-50" />
                      <p className="text-lg">Таблица пока пустая</p>
                      {isAdmin && <p className="text-sm">Добавьте первую команду для начала</p>}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedTeams.map((team, index) => (
                  <TableRow key={team.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-semibold">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {team.logo_url ? (
                          <img src={team.logo_url} alt={team.name} className="w-8 h-8 object-contain" />
                        ) : (
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                            <Icon name="Shield" size={20} className="text-muted-foreground" />
                          </div>
                        )}
                        <span className="font-semibold">{team.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{team.games_played}</TableCell>
                    <TableCell className="text-center font-semibold text-green-600">{team.wins}</TableCell>
                    <TableCell className="text-center font-semibold text-red-600">{team.losses}</TableCell>
                    <TableCell className="text-center font-semibold text-orange-600">{team.ot_losses}</TableCell>
                    <TableCell className="text-center">{team.goals_for}</TableCell>
                    <TableCell className="text-center">{team.goals_against}</TableCell>
                    <TableCell className={`text-center font-semibold ${team.goals_for - team.goals_against > 0 ? 'text-green-600' : team.goals_for - team.goals_against < 0 ? 'text-red-600' : ''}`}>
                      {team.goals_for - team.goals_against > 0 ? '+' : ''}{team.goals_for - team.goals_against}
                    </TableCell>
                    <TableCell className="text-center font-bold text-lg">{calculatePoints(team.wins, team.ot_losses)}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            onClick={() => handleMoveTeam(team.id, 'up')}
                            disabled={index === 0}
                            variant="ghost"
                            size="sm"
                          >
                            <Icon name="ChevronUp" size={16} />
                          </Button>
                          <Button
                            onClick={() => handleMoveTeam(team.id, 'down')}
                            disabled={index === sortedTeams.length - 1}
                            variant="ghost"
                            size="sm"
                          >
                            <Icon name="ChevronDown" size={16} />
                          </Button>
                          <Button onClick={() => openEditDialog(team)} variant="ghost" size="sm">
                            <Icon name="Edit" size={16} />
                          </Button>
                          <Button onClick={() => handleDeleteTeam(team.id)} variant="ghost" size="sm">
                            <Icon name="Trash2" size={16} className="text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <div className="mt-6 text-sm text-muted-foreground text-center">
          <p>И - Игры | В - Победы | П - Поражения | ПО - Поражения в овертайме | ЗШ - Заброшенные шайбы | ПШ - Пропущенные шайбы | О - Очки</p>
        </div>
      </main>

      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Вход в админ-панель</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Введите пароль"
              />
            </div>
            <Button onClick={handleLogin} className="w-full">Войти</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingTeam || isAddingTeam} onOpenChange={(open) => {
        if (!open) {
          setEditingTeam(null)
          setIsAddingTeam(false)
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTeam ? 'Редактировать команду' : 'Добавить команду'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label htmlFor="name">Название команды</Label>
              <Input
                id="name"
                value={teamForm.name}
                onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="logo">Логотип</Label>
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              />
            </div>
            <div>
              <Label htmlFor="games">Игры</Label>
              <Input
                id="games"
                type="number"
                value={teamForm.games_played}
                onChange={(e) => setTeamForm({ ...teamForm, games_played: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="wins">Победы</Label>
              <Input
                id="wins"
                type="number"
                value={teamForm.wins}
                onChange={(e) => setTeamForm({ ...teamForm, wins: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="losses">Поражения</Label>
              <Input
                id="losses"
                type="number"
                value={teamForm.losses}
                onChange={(e) => setTeamForm({ ...teamForm, losses: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="ot_losses">Поражения ОТ</Label>
              <Input
                id="ot_losses"
                type="number"
                value={teamForm.ot_losses}
                onChange={(e) => setTeamForm({ ...teamForm, ot_losses: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="goals_for">Заброшенные</Label>
              <Input
                id="goals_for"
                type="number"
                value={teamForm.goals_for}
                onChange={(e) => setTeamForm({ ...teamForm, goals_for: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="goals_against">Пропущенные</Label>
              <Input
                id="goals_against"
                type="number"
                value={teamForm.goals_against}
                onChange={(e) => setTeamForm({ ...teamForm, goals_against: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setEditingTeam(null)
              setIsAddingTeam(false)
            }}>
              Отмена
            </Button>
            <Button onClick={handleSaveTeam} disabled={!teamForm.name}>
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Index