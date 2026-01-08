import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useTeams } from '../hooks/useTeams';

const mockApi = vi.fn(() => Promise.resolve([]));
vi.mock('../hooks/useApi', () => ({ useApi: () => mockApi }));

const TestComponent = () => {
  const { list, create, invite, acceptInvite, requestJoin, approveRequest, registerInCompetition, mine, update, remove, listRequests, getMembers, removeMember, leave } = useTeams();

  return (
    <div>
      <button onClick={() => list('q', 'c1')}>list</button>
      <button onClick={() => create({})}>create</button>
      <button onClick={() => invite('t1', {})}>invite</button>
      <button onClick={() => acceptInvite('tok')}>accept</button>
      <button onClick={() => requestJoin('t2')}>request</button>
      <button onClick={() => approveRequest('r1')}>approve</button>
      <button onClick={() => registerInCompetition('t3', 'comp1')}>register</button>
      <button onClick={() => mine()}>mine</button>
      <button onClick={() => update('t4', {})}>update</button>
      <button onClick={() => remove('t5')}>remove</button>
      <button onClick={() => listRequests('t6')}>listRequests</button>
      <button onClick={() => getMembers('t7')}>getMembers</button>
      <button onClick={() => removeMember('m1')}>removeMember</button>
      <button onClick={() => leave()}>leave</button>
    </div>
  );
};

describe('useTeams', () => {
  it('calls api with correct paths for common actions', async () => {
    render(<TestComponent />);

    fireEvent.click(screen.getByText('list'));
    fireEvent.click(screen.getByText('create'));
    fireEvent.click(screen.getByText('invite'));
    fireEvent.click(screen.getByText('accept'));
    fireEvent.click(screen.getByText('request'));
    fireEvent.click(screen.getByText('approve'));
    fireEvent.click(screen.getByText('register'));
    fireEvent.click(screen.getByText('mine'));
    fireEvent.click(screen.getByText('update'));
    fireEvent.click(screen.getByText('remove'));
    fireEvent.click(screen.getByText('listRequests'));
    fireEvent.click(screen.getByText('getMembers'));
    fireEvent.click(screen.getByText('removeMember'));
    fireEvent.click(screen.getByText('leave'));

    expect(mockApi).toHaveBeenCalledWith('/teams?q=q&country_id=c1');
    expect(mockApi).toHaveBeenCalledWith('/teams', { method: 'POST', body: {} });
    expect(mockApi).toHaveBeenCalledWith('/teams/t1/invite', { method: 'POST', body: {} });
    expect(mockApi).toHaveBeenCalledWith('/teams/invitations/accept', { method: 'POST', body: { token: 'tok' } });
    expect(mockApi).toHaveBeenCalledWith('/teams/t2/requests', { method: 'POST' });
    expect(mockApi).toHaveBeenCalledWith('/teams/requests/r1/approve', { method: 'POST' });
    expect(mockApi).toHaveBeenCalledWith('/teams/t3/register-competition', { method: 'POST', body: { competition_id: 'comp1' } });
    expect(mockApi).toHaveBeenCalledWith('/teams/mine');
    expect(mockApi).toHaveBeenCalledWith('/teams/t4', { method: 'PUT', body: {} });
    expect(mockApi).toHaveBeenCalledWith('/teams/t5', { method: 'DELETE' });
    expect(mockApi).toHaveBeenCalledWith('/teams/t6/requests');
    expect(mockApi).toHaveBeenCalledWith('/team-members?team_id=t7');
    expect(mockApi).toHaveBeenCalledWith('/team-members/m1', { method: 'DELETE' });
    expect(mockApi).toHaveBeenCalledWith('/teams/leave', { method: 'POST' });
  });
});
